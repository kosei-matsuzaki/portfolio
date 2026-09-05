"""ツミアゲ（Flutter）の Linux デスクトップ版を実際に操作して録画する。

アプリ名は 2026-08 に「ミチシルベ」→「ツミアゲ」へ改名した。ファイル名・スラッグ・
素材のパスは旧名のままにしてある（公開済み URL を変えないため）。

    python3 scripts/record-michishirube.py [クリップ名 ...]

他の作品（Fluid Lab / GOLD RUSH / Piano Studio）はブラウザ製なので
puppeteer で録画しているが、この作品は Flutter アプリなので方法が違う。

前提:
  1. WSLg（X11）が使えること。DISPLAY=:0 と GDK_BACKEND=x11 で動かす
  2. 元リポジトリで Linux 版をビルド済みであること
         export PATH="$HOME/flutter/bin:$PATH"
         cd ../artifacts/study-app/app && flutter build linux --release
  3. スクショ用のデモデータが ~/tsumiage.db.rec-base にあること
     （無ければ元リポジトリの `python3 tools/seed_demo_data.py` で作って cp する）
  4. python3 -c "import Xlib" が通ること（python-xlib）／ ffmpeg

やっていること:
  - 起動タブは環境変数 TSUMIAGE_TAB で選ぶ（1 窓の中を辿るより確実。元リポジトリの
    tools/capture_screens.py と同じ手）
  - WSLg はルートウィンドウに中身を描かないので ffmpeg の x11grab では真っ黒になる。
    X の GetImage でウィンドウから直接フレームを吸い出して ffmpeg に流し込む
  - ポインタ移動は warp_pointer（XTEST の MotionNotify は XWayland では無視される）
  - 画面は 390x844 の縦長。サイト側もこの比率のまま置く（16:10 に収めると
    スマホ画面が小さくなって文字が読めない）。一覧のカードだけは CSS 側で
    16:10 の枠に letterbox する
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
APP = (ROOT.parent / "artifacts/study-app/app/build/linux/x64/release/bundle/tsumiage")
DB = Path.home() / "tsumiage.db"
DB_BASE = Path.home() / "tsumiage.db.rec-base"
WORK = ROOT / ".rec-michishirube"                        # 中間ファイル（.gitignore 済み）

FPS = 30
W, H = 390, 844                                          # アプリの窓（スマホ相当）


# ---------------------------------------------------------------- 操作の記述
def click(x, y, wait=1.5):
    return ("click", x, y, wait)


def scroll(x, y, notches, wait=1.2):
    """下向きが正。ホイール 1 ノッチずつ送る。"""
    return ("scroll", x, y, notches, wait)


def hold(sec):
    return ("hold", sec)


# タブ番号: 0=今日 1=目標 2=タイマー 3=統計 4=設定
# （schedule は「今日」から「先の予定」を押して入る画面。タブではない）
CLIPS = {
    # 今日のノルマ → 記録すると達成リングが埋まる
    "today": (0, [
        hold(1.6),
        scroll(195, 500, 3, 2.0),          # 下の「復習（忘却曲線）」まで見せる
        scroll(195, 500, -3, 1.2),
        click(195, 437, 2.0),              # 1 件目のノルマをタップ → 記録シート
        click(116, 643, 0.9),              # +30 分
        click(181, 643, 1.1),              # +60 分
        click(195, 794, 3.0),              # 記録する → 0/2 が 1/2 に
        click(195, 490, 2.0),              # 2 件目（記録しても行は動かない）
        click(195, 794, 3.2),              # 1/2 → 2/2
    ]),
    # 目標と教材 → 進め方を教材ごとに決める（v1.1.0 の看板）
    "plan": (1, [
        hold(1.8),
        click(347, 221, 3.0),              # 教材の鉛筆 → 「教材を編集」
        click(290, 505, 2.2),              # やる曜日に土を足す → 19回15ページ が 23回13ページ に
        click(84, 383, 2.2),               # 進め方「自分で決める」→ 曜日ごとに量を書ける
        click(195, 383, 1.8),              # 「おまかせ」に戻す
        click(195, 798, 2.8),              # 保存する
    ]),
    # 予定 → カレンダーと「終わる見込み」（v1.1.0 で新設）
    "schedule": (0, [
        hold(1.6),
        click(330, 113, 2.8),              # 「先の予定」→ 予定画面
        hold(1.2),
        click(148, 198, 2.4),              # 先の日を選ぶ → その日のやること
        scroll(195, 500, 4, 2.6),          # 終わる見込み（教材ごとの完了予測日）
        scroll(195, 500, 3, 2.6),
        scroll(195, 500, -7, 1.2),
    ]),
    # 統計 → 続けた記録の可視化
    "stats": (3, [
        hold(2.0),
        scroll(195, 450, 4, 2.4),          # 直近 7 日間 → 曜日ごとの平均
        scroll(195, 450, 4, 2.4),          # 週別の推移
        scroll(195, 450, 4, 2.6),          # 学習ヒートマップ
        scroll(195, 450, -12, 1.2),
    ]),
    # 設定 → 端末内で完結していること（テーマ・外観・バックアップ）
    "settings": (4, [
        hold(1.8),
        click(153, 170, 1.6),              # テーマ: ミント
        click(315, 170, 1.6),              # テーマ: さくら
        click(93, 170, 1.4),               # テーマ: そら（既定）に戻す
        click(340, 296, 1.8),              # 外観: 暗い
        click(124, 296, 1.8),              # 外観: 自動 に戻す
        scroll(195, 450, 3, 2.6),          # データ（JSON バックアップ）
        scroll(195, 450, -3, 1.4),
    ]),
    # タイマー → 計測しながら BGM を選ぶ
    "timer": (2, [
        hold(1.6),
        click(195, 558, 7.0),              # スタート → 計測中
        click(195, 731, 3.0),              # BGM を選ぶ（全 80 曲）
        scroll(195, 600, 3, 2.0),
        click(195, 60, 2.0),               # シートの外をタップして閉じる
        hold(1.6),
    ]),
}

HERO = ["today", "plan", "stats", "timer"]               # つなぐ順番

# ポスター（1 コマ目の静止画）に使う秒数。動きの途中を掴まないよう明示する
POSTER_AT = {"today": 1.2, "plan": 1.2, "schedule": 6.0, "stats": 1.4,
             "timer": 1.2, "settings": 1.2, "hero": 0.8}


# ---------------------------------------------------------------- X まわり
def find_window(dsp, root):
    """タイトルが tsumiage の窓を探して (window, ルート座標 x, y) を返す。"""
    for win in root.query_tree().children:
        for w in [win] + list(win.query_tree().children):
            try:
                if w.get_wm_name() == "tsumiage":
                    c = w.translate_coords(root, 0, 0)
                    return w, -c.x, -c.y
            except Exception:
                pass
    return None


class Capture(threading.Thread):
    """窓の中身を FPS 一定で吸い出して ffmpeg に流す。

    python-xlib の Display はスレッド安全ではないので、**操作側（warp_pointer /
    fake_input / sync）とは別の接続を開く**。同じ接続を共有すると稀に応答待ちの
    まま両方が固まる（settings クリップが 25 分ハングした）。
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
    tab, actions = CLIPS[name]
    raw = WORK / f"{name}.mp4"
    WORK.mkdir(exist_ok=True)

    shutil.copyfile(DB_BASE, DB)                          # 毎回おなじ状態から始める
    env = {**os.environ, "DISPLAY": ":0", "GDK_BACKEND": "x11",
           "TSUMIAGE_TAB": str(tab)}
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
            "ffmpeg", "-loglevel", "error", "-y", "-ss", "1.0", "-t", str(seg),
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
                 "  cd ../artifacts/study-app/app && flutter build linux --release")
    if not DB_BASE.exists():
        sys.exit(f"デモデータがありません: {DB_BASE}")

    WORK.mkdir(exist_ok=True)
    vid = ROOT / "public/video/michishirube"
    img = ROOT / "public/images/michishirube"
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

    print("\n完了。`npm run sizes` と `npm run assets:sync -- --recorded=michishirube` を実行してください。")


if __name__ == "__main__":
    main()
