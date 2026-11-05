from manim import *

config.pixel_width = 1280
config.pixel_height = 720
config.frame_width = 16
config.frame_height = 9
config.frame_rate = 30
config.background_color = "#0E1621"

ACCENT = "#D97757"   # warm coral
INK = "#E8E6E3"
MUTED = "#5C6773"
STEPS = ["Idea", "Code", "Render", "Video"]
FONT = "DejaVu Sans"


def pipeline(active):
    """Top progress bar: four labelled dots, steps <= active lit."""
    group = VGroup()
    dots = VGroup()
    for i, name in enumerate(STEPS):
        lit = i <= active
        dot = Circle(radius=0.16, stroke_width=3,
                     stroke_color=ACCENT if lit else MUTED,
                     fill_color=ACCENT, fill_opacity=1 if lit else 0)
        label = Text(name, font=FONT, font_size=22, color=INK if lit else MUTED)
        label.next_to(dot, DOWN, buff=0.15)
        dots.add(VGroup(dot, label))
    dots.arrange(RIGHT, buff=2.2).to_edge(UP, buff=0.5)
    for a, b in zip(dots[:-1], dots[1:]):
        lit = dots.submobjects.index(b) <= active
        group.add(Line(a[0].get_right(), b[0].get_left(), stroke_width=3,
                       color=ACCENT if lit else MUTED))
    group.add(dots)
    return group


def caption(text):
    return Text(text, font=FONT, font_size=40, color=INK).shift(DOWN * 1.75)


class Scene1_Idea(Scene):
    def construct(self):
        dur = 2.609
        self.add_subcaption("Every video starts with an idea.", duration=dur)
        bulb = Circle(radius=1.0, color=ACCENT, fill_opacity=0.15, stroke_width=6)
        base = RoundedRectangle(width=0.9, height=0.55, corner_radius=0.1,
                                color=INK, stroke_width=5).next_to(bulb, DOWN, buff=-0.05)
        rays = VGroup(*[
            Line(ORIGIN, RIGHT * 0.45, color=ACCENT, stroke_width=5)
            .shift(RIGHT * 1.35).rotate(a, about_point=ORIGIN)
            for a in np.linspace(PI / 6, 5 * PI / 6, 5)
        ]).move_to(bulb.get_center() + UP * 0.55)
        icon = VGroup(bulb, base, rays).shift(UP * 0.3)
        self.play(FadeIn(pipeline(0)), GrowFromCenter(VGroup(bulb, base)), run_time=0.8)
        self.play(LaggedStart(*[Create(r) for r in rays], lag_ratio=0.15),
                  Write(caption("Idea")), run_time=1.0)
        self.wait(max(0, dur - 1.8))


class Scene2_Code(Scene):
    def construct(self):
        dur = 2.492
        self.add_subcaption("Claude turns that idea into code.", duration=dur)
        win = RoundedRectangle(width=6, height=3.2, corner_radius=0.2,
                               color=MUTED, fill_color="#16202C", fill_opacity=1).shift(UP * 0.3)
        lights = VGroup(*[Dot(radius=0.07, color=c) for c in ("#E5534B", "#E5B84B", "#57AB5A")])
        lights.arrange(RIGHT, buff=0.12).move_to(win.get_corner(UL) + RIGHT * 0.5 + DOWN * 0.3)
        widths = [3.8, 2.6, 4.4, 1.9, 3.2]
        colors = [ACCENT, INK, "#6CB6FF", INK, ACCENT]
        code = VGroup(*[
            RoundedRectangle(width=w, height=0.18, corner_radius=0.09,
                             stroke_width=0, fill_color=c, fill_opacity=0.85)
            for w, c in zip(widths, colors)
        ]).arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        code.move_to(win.get_center() + DOWN * 0.15).align_to(win, LEFT).shift(RIGHT * 0.6)
        self.add(pipeline(0))
        self.play(Transform(self.mobjects[0], pipeline(1)), FadeIn(win, lights), run_time=0.6)
        self.play(LaggedStart(*[GrowFromEdge(l, LEFT) for l in code], lag_ratio=0.25),
                  Write(caption("Code")), run_time=1.3)
        self.wait(max(0, dur - 1.9))


class Scene3_Render(Scene):
    def construct(self):
        dur = 2.829
        self.add_subcaption("The code is rendered, frame by frame.", duration=dur)
        frames = VGroup(*[
            RoundedRectangle(width=1.6, height=1.0, corner_radius=0.08,
                             color=INK, stroke_width=3,
                             fill_color=ACCENT, fill_opacity=0.0)
            for _ in range(6)
        ]).arrange(RIGHT, buff=0.3).shift(UP * 0.3)
        self.add(pipeline(1))
        self.play(Transform(self.mobjects[0], pipeline(2)), Write(caption("Render")), run_time=0.6)
        self.play(LaggedStart(*[
            Succession(FadeIn(f, shift=UP * 0.3, run_time=0.25),
                       f.animate(run_time=0.25).set_fill(opacity=0.7))
            for f in frames
        ], lag_ratio=0.35), run_time=1.8)
        self.wait(max(0, dur - 2.4))


class Scene4_Video(Scene):
    def construct(self):
        dur = 2.202
        self.add_subcaption("And out comes a finished video.", duration=dur)
        screen = RoundedRectangle(width=5.2, height=2.9, corner_radius=0.2,
                                  color=ACCENT, stroke_width=6,
                                  fill_color="#16202C", fill_opacity=1).shift(UP * 0.3)
        play_btn = Triangle(color=ACCENT, fill_opacity=1).rotate(-PI / 2).scale(0.55)
        play_btn.move_to(screen)
        self.add(pipeline(2))
        self.play(Transform(self.mobjects[0], pipeline(3)), DrawBorderThenFill(screen),
                  Write(caption("Video")), run_time=0.8)
        self.play(GrowFromCenter(play_btn), run_time=0.4)
        self.play(play_btn.animate.scale(1.15), rate_func=there_and_back, run_time=0.5)
        self.wait(max(0, dur - 1.7))
