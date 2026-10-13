# Builds a test PDF that looks like a real Common App print preview: a diagonal "PREVIEW"
# watermark, a running header with name and CAID, "Page N of M" footers, a browser print stamp
# with URL, numbered activities, a citizenship section and the full prompt list before the essay.
import sys, textwrap
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def build(out, total):
    c = canvas.Canvas(out, pagesize=letter)
    W, H = letter
    st = {"y": H - 80, "page": 1}

    def decorate():
        c.saveState()
        c.setFont("Helvetica-Bold", 90); c.setFillGray(0.85)
        c.translate(W / 2, H / 2); c.rotate(45); c.drawCentredString(0, 0, "PREVIEW")
        c.restoreState()
        c.setFont("Helvetica", 8)
        c.drawString(50, H - 30, "Aarav Sharma")
        c.drawRightString(W - 50, H - 30, "CAID: 41234567")
        c.drawString(50, 30, "10/12/2026, 4:18 PM")
        c.drawCentredString(W / 2, 30, "https://apply.commonapp.org/summary/print")
        c.drawRightString(W - 50, 30, f"Page {st['page']} of {total}")

    def new_page():
        c.showPage(); st["page"] += 1; st["y"] = H - 80; decorate()

    def need(h):
        if st["y"] - h < 60: new_page()

    def header(t):
        need(40); st["y"] -= 10
        c.setFont("Helvetica-Bold", 13); c.drawString(50, st["y"], t); st["y"] -= 22

    def row(label, value, wrap=70):
        lines = textwrap.wrap(value, wrap) or [""]
        need(14 * len(lines) + 4)
        c.setFont("Helvetica-Bold", 9); c.drawString(50, st["y"], label)
        c.setFont("Helvetica", 9)
        for i, ln in enumerate(lines): c.drawString(230, st["y"] - i * 12, ln)
        st["y"] -= 12 * len(lines) + 4

    def text(t, size=9, bold=False):
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        for ln in textwrap.wrap(t, 105):
            need(12); c.drawString(50, st["y"], ln); st["y"] -= 12

    decorate()
    c.setFont("Helvetica-Bold", 16); c.drawString(50, st["y"], "Common App"); st["y"] -= 30
    header("Personal Information")
    row("Legal name", "")
    row("First/given name:", "Aarav")
    row("Middle name:", "")
    row("Last/family/surname:", "Sharma")
    row("Date of birth:", "03/14/2009")
    row("Permanent home address:", "1420 Hobson Rd, Naperville, IL 60540")
    header("Demographics")
    row("Citizenship status:", "Other (non-US)")
    row("Visa type:", "H-4")
    row("Countries of citizenship:", "India")
    header("Family")
    row("Parent 1 Highest level of education:", "Graduate school")
    header("Education")
    row("Current or most recent secondary/high school:", "Naperville North High School")
    row("Date of entry:", "08/2022")
    row("Graduation date:", "May 2027")
    header("Grades")
    row("Graduating class size (approx.):", "740")
    row("Class rank reporting:", "Exact")
    row("Class rank:", "18")
    row("Cumulative GPA:", "3.97")
    row("GPA scale:", "4")
    row("GPA weighting:", "Unweighted")
    header("Current or Most Recent Year Courses")
    for cl in ["AP Calculus BC", "AP Physics C: Mechanics", "AP Computer Science A", "AP English Language", "AP US History", "AP Chemistry", "Honors Spanish IV"]:
        row("Course:", cl)
    header("Testing")
    row("Highest evidence-based reading and writing score:", "750")
    row("Highest math score:", "790")
    header("Activities")
    acts = [
        ("Robotics", "Captain and lead programmer", "FRC Team 4096 Ctrl-Z", "Led 35-member team to 2026 Illinois state finals; wrote vision-tracking code; taught 40 middle schoolers Python.", "9, 10, 11, 12", "14", "40"),
        ("Computer/Technology", "Founder", "CodeBridge Naperville", "Founded free weekend coding classes at 2 libraries; 120 students served; raised $3,200 from local businesses.", "10, 11, 12", "5", "36"),
        ("Debate/Speech", "Varsity member", "Naperville North Speech & Debate", "Public forum debater; qualified to state tournament junior year.", "10, 11, 12", "6", "30"),
        ("Work (Paid)", "Math tutor", "Mathnasium of Naperville", "Tutor 8 students weekly in algebra and geometry.", "11, 12", "8", "45"),
    ]
    for i, (t, pos, org, desc, gl, hrs, wks) in enumerate(acts, 1):
        text(f"Activity {i}", 10, True); st["y"] -= 2
        row("Activity type:", t)
        row("Position/leadership description:", pos)
        row("Organization name:", org)
        row("Please describe this activity, including what you accomplished and any recognition you received, etc.:", desc, wrap=60)
        row("Participation grade levels:", gl)
        row("Timing of participation:", "During school year")
        row("Hours spent per week:", hrs)
        row("Weeks spent per year:", wks)
        row("I intend to participate in a similar activity in college:", "Yes")
    header("Honors")
    row("Honors title:", "USACO Gold Division"); row("Grade level:", "11"); row("Level(s) of recognition:", "National")
    row("Honors title:", "AP Scholar with Distinction"); row("Grade level:", "11"); row("Level(s) of recognition:", "National")
    row("Honors title:", "Illinois State Scholar"); row("Grade level:", "12"); row("Level(s) of recognition:", "State")
    header("Future Plans")
    row("Career interest:", "Computer Science")
    header("Writing")
    text("Personal essay", 11, True); st["y"] -= 4
    text("The essay demonstrates your ability to write clearly and concisely on a selected topic and helps you distinguish yourself in your own voice. What do we want to know about you? Keep that question at the center of your writing. Use the prompt to inspire and structure your response. Remember: 650 words is your limit, not your goal. Use the full range if you need it, but don't feel obligated to do so.")
    st["y"] -= 6
    text("Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?")
    st["y"] -= 8
    essay = ("The first time our robot drove itself across the field, it hit the wall at full speed, and thirty-five people turned to look at me. " +
             "I had written the vision code the night before, convinced that a camera and a few hundred lines of Python could see the way a driver sees. " * 2 +
             "That collision taught me more than any tutorial: a machine only notices what you teach it to notice, and so do people. " * 4 +
             "Now, when I teach Saturday classes at the library, I watch which kids stop raising their hands and ask them what they noticed first. " * 3 +
             "I still lose track of time debugging, but I have learned that the best fixes start with a better question.").strip()
    for para in [essay[:700], essay[700:1400], essay[1400:]]:
        text(para); st["y"] -= 8
    header("Additional information")
    row("Do you wish to provide details of circumstances?", "No")
    c.save()
    return st["page"]

out = sys.argv[1]
n = build(out, 1)
build(out, n)
print("ok", out, n, "pages")
