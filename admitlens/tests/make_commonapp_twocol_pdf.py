# A Common App-style print preview in the real two-column layout: question labels wrap in the
# left column while answers wrap in the right column on the same baselines, plus a running
# header (name + CAID), a footer (print date + page number), a large horizontal "PREVIEW"
# watermark, numbered Activity/Honor headings, a course list with levels, AP exam scores,
# parents' education, and an essay that crosses a page break.
import sys, textwrap
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def build(out, total):
    c = canvas.Canvas(out, pagesize=letter)
    W, H = letter
    st = {"y": H - 90, "page": 1}
    LX, VX = 50, 262

    def decorate():
        c.setFont("Helvetica", 8)
        c.drawString(LX, H - 34, "Jordan Okafor")
        c.drawRightString(W - 50, H - 34, "CAID 52018834")
        c.drawString(LX, H - 46, "Common App 2026-2027 | Application Preview")
        c.drawString(LX, 30, "Printed 10/13/2026 9:02 PM")
        c.drawRightString(W - 50, 30, f"{st['page']} of {total}")
        c.saveState(); c.setFillGray(0.9); c.setFont("Helvetica-Bold", 96)
        c.drawCentredString(W / 2, H / 2 - 30, "PREVIEW"); c.restoreState()

    def new_page():
        c.showPage(); st["page"] += 1; st["y"] = H - 90; decorate()

    def need(h):
        if st["y"] - h < 70: new_page()

    def header(t):
        need(36); st["y"] -= 8
        c.setFont("Helvetica-Bold", 12.5); c.drawString(LX, st["y"], t); st["y"] -= 20

    def sub(t):
        need(22); c.setFont("Helvetica-Bold", 10); c.drawString(LX, st["y"], t); st["y"] -= 15

    def row(label, value):
        if STACKED:
            # Question on its own line(s), answer underneath.
            for ln in textwrap.wrap(label + ":", 95):
                need(12); c.setFont("Helvetica-Bold", 8.5); c.drawString(LX, st["y"], ln); st["y"] -= 11
            for ln in textwrap.wrap(value, 95) or [""]:
                need(12); c.setFont("Helvetica", 9.5); c.drawString(LX + 10, st["y"], ln); st["y"] -= 12
            st["y"] -= 6
            return
        ll = textwrap.wrap(label, 34) or [""]
        vl = textwrap.wrap(value, 52) or [""]
        n = max(len(ll), len(vl))
        need(12 * n + 5)
        for i in range(n):
            if i < len(ll): c.setFont("Helvetica", 9); c.drawString(LX, st["y"], ll[i])
            if i < len(vl): c.setFont("Helvetica", 9); c.drawString(VX, st["y"], vl[i])
            st["y"] -= 12
        st["y"] -= 5

    def para(t, size=9.5):
        c.setFont("Helvetica", size)
        for ln in textwrap.wrap(t, 100):
            need(13); c.drawString(LX, st["y"], ln); st["y"] -= 13
        st["y"] -= 7

    decorate()
    header("Profile")
    row("First/given name", "Jordan")
    row("Last/family/surname", "Okafor")
    row("Date of birth", "07/02/2009")
    row("Permanent home address", "818 W Grace St, Chicago, IL 60613")
    header("Demographics")
    row("Citizenship status", "U.S. permanent resident")
    header("Family")
    row("Parent 1 highest level of education", "High school graduate")
    row("Parent 2 highest level of education", "Bachelor's degree")
    header("Education")
    row("Current or most recent secondary/high school", "Lane Technical College Prep High School")
    row("Graduation date", "June 2027")
    header("Grades")
    row("Graduating class size (approx.)", "1,050")
    row("Class rank reporting", "None")
    row("Cumulative GPA", "4.31")
    row("GPA scale", "5")
    row("GPA weighting", "Weighted")
    header("Current or Most Recent Year Courses")
    for t, lvl in [("Calculus BC", "Advanced Placement (AP)"), ("Physics C: Mechanics", "Advanced Placement (AP)"), ("English Literature", "Advanced Placement (AP)"), ("Spanish V", "Honors"), ("Multivariable Calculus", "Dual Enrollment"), ("Civics", "Regular/Standard")]:
        row("Course title", t); row("Course level", lvl)
    header("Testing")
    row("Highest evidence-based reading and writing score", "720")
    row("Highest math score", "770")
    row("AP subject", "Biology"); row("AP score", "5")
    row("AP subject", "Calculus AB"); row("AP score", "5")
    header("Honors")
    honors = [("National Merit Semifinalist", "12", "National"), ("Illinois Science Olympiad, 1st place Chemistry Lab", "11", "School, State/Regional"), ("Principal's Honor Roll", "9, 10, 11", "School")]
    for i, (t, g, l) in enumerate(honors, 1):
        sub(f"Honor {i}")
        row("Honors title", t); row("Grade level", g); row("Level(s) of recognition", l)
    header("Activities")
    acts = [
        ("Science/Math", "Co-captain", "Lane Tech Science Olympiad", "Led 28-member team to 2nd at state; built the chemistry lab protocol binder; tutored 10 freshmen", "9, 10, 11, 12", "8", "30"),
        ("Community Service (Volunteer)", "Volunteer tutor", "Chicago Public Library, Lincoln Park", "Tutor elementary students in reading twice a week; 300+ hours total", "10, 11, 12", "4", "40"),
        ("Work (Paid)", "Cashier", "Mariano's", "Weekend shifts to help with family expenses", "11, 12", "15", "48"),
    ]
    for i, (t, pos, org, desc, gl, hrs, wks) in enumerate(acts, 1):
        sub(f"Activity {i}")
        row("Activity type", t)
        row("Position/Leadership description", pos)
        row("Organization Name", org)
        row("Please describe this activity, including what you accomplished and any recognition you received, etc.", desc)
        row("Participation grade levels", gl)
        row("Timing of participation", "During school year, During school break")
        row("Hours spent per week", hrs)
        row("Weeks spent per year", wks)
        row("I intend to participate in a similar activity in college.", "Yes")
    header("Future Plans")
    row("Career interest", "Chemical Engineering")
    header("Writing")
    sub("Personal essay")
    para("Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.")
    essay = [
        "My grandmother measures rice with her knuckles. Water to the first crease, she told me when I was six, and for years I believed every pot in Chicago worked that way.",
        "In tenth grade chemistry I learned why it works: the ratio stays the same because the depth of the rice sets the depth of the water. I came home and tested it with three pots and a ruler, and wrote the numbers on the back of an electric bill. She laughed and said the knuckle was faster.",
        "That kitchen experiment became my Science Olympiad lab binder. I started writing down every protocol the way she taught me to cook: what you see, what you smell, when to stop. Our team used it at state. When a freshman asked me why we bothered writing it all down, I told her the truth: because someone taught me, and someone will need to learn from us.",
        "I want to study chemical engineering because I like the moment a rule of thumb turns into a reason. But I have stopped thinking the reason is better than the rule. My grandmother never needed the ruler. She needed someone to keep asking her why.",
    ]
    for p in essay: para(p, 10)
    header("Additional information")
    row("Do you wish to provide details of circumstances?", "No")
    c.save()
    return st["page"]

out = sys.argv[1]
STACKED = len(sys.argv) > 2 and sys.argv[2] == "stacked"
n = build(out, 1); build(out, n)
print("ok", out, n, "pages")
