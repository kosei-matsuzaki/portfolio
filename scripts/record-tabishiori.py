"""タビシオリ（Flutter）の Linux デスクトップ版を実際に操作して録画する。

    python3 scripts/record-tabishiori.py [クリップ名 ...]

姉妹アプリ「ツミアゲ」の record-michishirube.py と同じ作りだが、
起動タブを環境変数で選べない。しおり一覧から 1 冊開いてから下タブを辿る
（元リポジトリの tools/capture_screens.py と同じ道順・同じ座標）。

前提:
  1. WSLg（X11）が使えること。DISPLAY=:0 と GDK_BACKEND=x11 で動かす
  2. 元リポジトリで Linux 版をビルド済みであること。この端末では sudo が使えないので
     flutter_secure_storage_linux が要る libsecret は ~/devroot に展開してある
     （元リポジトリの CLAUDE.md「PC で画面を確認する」を参照）:
         export PATH="$HOME/flutter/bin:$PATH"
         export PKG_CONFIG_PATH=$HOME/devroot/usr/lib/x86_64-linux-gnu/pkgconfig
         export LIBRARY_PATH=$HOME/devroot/usr/lib/x86_64-linux-gnu
         export LD_LIBRARY_PATH=$HOME/devroot/usr/lib/x86_64-linux-gnu
         cd ../artifacts/travel-app/app && flutter build linux --debug
     **--release では焼けない。** install 先が /usr/local になって Permission denied で
     止まる（--debug は bundle へ入るので通る）。録画に使うのは見た目だけなので debug でよい
  3. デモデータが ~/tabishiori.db.rec-base にあること
     （無ければ元リポジトリの `python3 tools/seed_demo_data.py` で作って cp する）
  4. python3 -c "import Xlib" が通ること（python-xlib）／ ffmpeg

WSLg 固有の事情は record-michishirube.py の冒頭に書いたものと同じ:
ルートウィンドウには何も描かれないので x11grab は使えず、X の GetImage で
窓から直接フレームを吸い出す。ポインタ移動は warp_pointer（XTEST の
MotionNotify は XWayland では無視される）。
"""

import os
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

from Xlib import X, display
from Xlib.ext import xtest

ROOT = Path(__file__).resolve().parents[1]              # portfolio-site/
APP = (ROOT.parent
       / "artifacts/travel-app/app/build/linux/x64/debug/bundle/tabishiori")
DEVROOT_LIB = Path.home() / "devroot/usr/lib/x86_64-linux-gnu"   # libsecret の置き場
DB = Path.home() / ".local/share/com.sunl19ht.tabishiori/tabishiori.db"
DB_BASE = Path.home() / "tabishiori.db.rec-base"
WORK = ROOT / ".rec-tabishiori"                          # 中間ファイル（.gitignore 済み）

FPS = 30
W, H = 390, 844                                          # アプリの窓（スマホ相当）
WM_NAME = "tabishiori"


# ---------------------------------------------------------------- 操作の記述
def click(x, y, wait=1.5):
    return ("click", x, y, wait)


def scroll(x, y, notches, wait=1.2):
    """下向きが正。ホイール 1 ノッチずつ送る。"""
    return ("scroll", x, y, notches, wait)


def hold(sec):
    return ("hold", sec)


# 窓の中の座標
# デモデータは台北のしおりを「いま使っているしおり」にしてあるので、**起動すると
# その日程が直接出る**（しおり一覧は経由しない）。tools/capture_screens.py は
# 一覧から辿る前提の座標なので、下タブと帯だけを借りている。
TAB_DOCS = (50, 800)
TAB_MONEY = (122, 800)
TAB_SCHEDULE = (195, 800)
TAB_MAP = (267, 800)
TAB_MENU = (340, 800)
SEG_MID, SEG_RIGHT = (195, 321), (313, 321)   # 費用タブの帯（一覧 / 内訳 / 割り勘）
DAY_TABS = [(51, 92), (127, 92), (203, 92), (279, 92)]     # 日程の 1〜4 日目
MAP_DAYS = [(43, 23), (111, 23), (176, 23), (241, 23)]     # 地図の すべて / 1〜3 日目

CLIPS = {
    # 日程 — 予定を開くと、その場に場所・書類・費用が出る。日をまたいで見せる
    "schedule": [
        hold(2.4),
        click(195, 625, 2.8),              # 台北101の展望台 を開く
        hold(2.6),
        click(195, 625, 1.8),              # 閉じる
        click(*DAY_TABS[1], 2.8),          # 2 日目
        hold(2.4),
        click(*DAY_TABS[2], 2.8),          # 3 日目
        hold(2.2),
    ],
    # 書類 — 一覧の時点で便名・座席が拾える。予約番号は伏字
    "docs": [
        hold(1.2),
        click(*TAB_DOCS, 2.8),
        hold(2.4),
        click(195, 259, 3.0),              # NH851 e チケット（飛行機の欄）
        hold(3.2),
    ],
    # 費用 — 現地通貨のまま記録し、集計だけ自国通貨に
    "money": [
        hold(1.2),
        click(*TAB_MONEY, 2.8),
        hold(2.4),
        click(*SEG_MID, 2.8),              # 内訳
        hold(2.4),
        click(*SEG_RIGHT, 3.0),            # 割り勘（誰が誰にいくら）
        hold(2.8),
    ],
    # 地図 — 登録した場所のピンと、日ごとの順路
    "map": [
        hold(1.2),
        click(*TAB_MAP, 5.5),              # タイルの取得を待つ
        hold(3.0),
        click(*MAP_DAYS[1], 3.2),          # 1 日目の順路
        hold(2.6),
        click(*MAP_DAYS[2], 3.2),          # 2 日目
        hold(2.6),
    ],
}

HERO = ["schedule", "docs", "money", "map"]              # つなぐ順番

# ポスター（静止画）に使う秒数。動きの途中を掴まないよう明示する
POSTER_AT = {"schedule": 6.0, "docs": 7.5, "money": 12.0,
             "map": 12.0, "hero": 1.5}


# ---------------------------------------------------------------- X まわり
def find_window(dsp, root):
    """タイトルが tabishiori の窓を探して (window, ルート座標 x, y) を返す。

    名前の**完全一致**で探す。前方一致だと、同じ名前を持つ 1x1 の隠し窓
    （アプリ ID の窓）を先に拾ってしまう。
    """
    for win in root.query_tree().children:
        for w in [win] + list(win.query_tree().children):
            try:
                name = w.get_wm_name()
            except Exception:
                continue
            if not name or str(name).strip().lower() != WM_NAME:
                continue
            c = w.translate_coords(root, 0, 0)
            return w, -c.x, -c.y
    return None


class Capture(threading.Thread):
    """窓の中身を FPS 一定で吸い出して ffmpeg に流す。

    python-xlib の Display はスレッド安全ではないので、**操作側（warp_pointer /
    fake_input / sync）とは別の接続を開く**。同じ接続を共有すると稀に応答待ちの
    まま両方が固まる。
    """

    LIMIT = 180.0                                        # 保険。これを超えたら打ち切る

    def __init__(self, win_id, proc):
        super().__init__(daemon=True)
        self.win_id, self.proc, self.stop = win_id, proc, threading.Event()

    def run(self):
        dsp = display.Display(":0")
        win = dsp.create_resource_object("window", self.win_id)
        step = 1.0 / FPS
        nxt = time.monotonic()
        end = nxt + self.LIMIT
        try:
            while not self.stop.is_set() and time.monotonic() < end:
                try:
                    img = win.get_image(0, 0, W, H, X.ZPixmap, 0xFFFFFFFF)
                    self.proc.stdin.write(img.data[: W * H * 4])
                except Exception:
                    break
                nxt += step
                time.sleep(max(0.0, nxt - time.monotonic()))
        finally:
            try:
                dsp.close()
            except Exception:
                pass


# ---------------------------------------------------------------- 録画
def record(name):
    actions = CLIPS[name]
    raw = WORK / f"{name}.mp4"
    WORK.mkdir(exist_ok=True)

    # 古い起動が残っていると、窓を名前で探すのでそちらを掴んでしまう
    subprocess.run(["killall", "-q", "tabishiori"])
    time.sleep(0.8)

    DB.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(DB_BASE, DB)                          # 毎回おなじ状態から始める
    env = {**os.environ, "DISPLAY": ":0", "GDK_BACKEND": "x11",
           "LD_LIBRARY_PATH": str(DEVROOT_LIB)}           # libsecret を実行時にも見せる
    app = subprocess.Popen([str(APP)], env=env,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        dsp = display.Display(":0")
        root = dsp.screen().root
        found = None
        for _ in range(60):
            time.sleep(0.5)
            found = find_window(dsp, root)
            if found:
                break
        if not found:
            raise RuntimeError(f"{name}: ウィンドウが出ませんでした")
        time.sleep(6.0)                                   # 初回描画とアニメーションの落ち着き待ち
        win, wx, wy = find_window(dsp, root)

        ff = subprocess.Popen([
            "ffmpeg", "-loglevel", "error", "-y",
            "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
            "-framerate", str(FPS), "-i", "-",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "16",
            "-pix_fmt", "yuv420p", str(raw),
        ], stdin=subprocess.PIPE)

        cap = Capture(win.id, ff)
        cap.start()

        def warp(x, y):
            root.warp_pointer(wx + x, wy + y)
            dsp.sync()
            time.sleep(0.35)

        for act in actions:
            kind = act[0]
            if kind == "hold":
                time.sleep(act[1])
                continue
            warp(act[1], act[2])
            if kind == "click":
                xtest.fake_input(dsp, X.ButtonPress, 1)
                dsp.sync()
                time.sleep(0.08)
                xtest.fake_input(dsp, X.ButtonRelease, 1)
                dsp.sync()
                time.sleep(act[3])
            else:                                          # scroll
                button = 5 if act[3] > 0 else 4
                for _ in range(abs(act[3])):
                    xtest.fake_input(dsp, X.ButtonPress, button)
                    xtest.fake_input(dsp, X.ButtonRelease, button)
                    dsp.sync()
                    time.sleep(0.12)
                time.sleep(act[4])

        cap.stop.set()
        cap.join(timeout=3)
        ff.stdin.close()
        ff.wait()
        print(f"  録画: {raw.name}")
    finally:
        app.terminate()
        try:
            app.wait(timeout=5)
        except subprocess.TimeoutExpired:
            app.kill()
        time.sleep(1.0)


# ---------------------------------------------------------------- 仕上げ
def finish(src, dest):
    """録画をそのままの比率（390x844）で配信用に焼き直す。"""
    subprocess.run([
        "ffmpeg", "-loglevel", "error", "-y", "-i", str(src),
        "-c:v", "libx264", "-preset", "slow", "-crf", "26",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(dest),
    ], check=True)
    print(f"  仕上げ: {dest.name}")


def poster(src, dest, at=None):
    args = ["ffmpeg", "-loglevel", "error", "-y"]
    if at:
        args += ["-ss", str(at)]
    args += ["-i", str(src), "-frames:v", "1", "-c:v", "libwebp",
             "-quality", "82", str(dest)]
    subprocess.run(args, check=True)


def build_hero(names):
    """各クリップから 7 秒ずつ取り出して xfade でつなぐ。"""
    seg, fade = 7.0, 0.7
    parts = []
    for i, n in enumerate(names):
        parts.append(WORK / f"hero-{i}.mp4")
        subprocess.run([
            "ffmpeg", "-loglevel", "error", "-y", "-ss", "2.5", "-t", str(seg),
            "-i", str(WORK / f"{n}.mp4"), "-c:v", "libx264", "-preset", "veryfast",
            "-crf", "16", "-pix_fmt", "yuv420p", str(parts[-1]),
        ], check=True)

    inputs = []
    for p in parts:
        inputs += ["-i", str(p)]
    chain, prev = "", "0:v"
    for i in range(1, len(parts)):
        off = i * (seg - fade)
        out = f"x{i}"
        chain += f"[{prev}][{i}:v]xfade=transition=fade:duration={fade}:offset={off:.2f}[{out}];"
        prev = out
    raw = WORK / "hero.mp4"
    subprocess.run([
        "ffmpeg", "-loglevel", "error", "-y", *inputs,
        "-filter_complex", chain.rstrip(";"), "-map", f"[{prev}]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "16",
        "-pix_fmt", "yuv420p", str(raw),
    ], check=True)
    return raw


def main():
    want = sys.argv[1:] or [*CLIPS, "hero"]   # 引数なしで全部（hero は録り直さず連結だけ）
    if not APP.exists():
        sys.exit(f"Linux 版が見つかりません: {APP}\n"
                 "  cd ../artifacts/travel-app/app && flutter build linux --release")
    if not DB_BASE.exists():
        sys.exit(f"デモデータがありません: {DB_BASE}")

    WORK.mkdir(exist_ok=True)
    vid = ROOT / "public/video/tabishiori"
    img = ROOT / "public/images/tabishiori"
    vid.mkdir(parents=True, exist_ok=True)
    img.mkdir(parents=True, exist_ok=True)

    for name in [n for n in want if n != "hero"]:
        print(f"\n■ {name}")
        record(name)
        finish(WORK / f"{name}.mp4", vid / f"{name}.mp4")
        poster(vid / f"{name}.mp4", img / f"{name}-poster.webp", at=POSTER_AT[name])

    if "hero" in want or set(HERO) <= set(want):
        print("\n■ hero")
        raw = build_hero(HERO)
        finish(raw, vid / "hero.mp4")
        poster(vid / "hero.mp4", img / "hero-poster.webp", at=POSTER_AT["hero"])

    print("\n完了。`npm run sizes` を実行してください。")


if __name__ == "__main__":
    main()
