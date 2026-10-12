# Builds a test PDF laid out like a Common App "Preview" export: section headers,
# label/value rows in two columns, wrapped values and a multi-page essay.
import sys, textwrap
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

out = sys.argv[1]
c = canvas.Canvas(out, pagesize=letter)
W, H = letter
y = H - 50

def need(h):
    global y
    if y - h < 50:
        c.showPage(); y = H - 50

def header(t):
    global y
    need(40); y -= 10
    c.setFont("Helvetica-Bold", 13); c.drawString(50, y, t); y -= 22

def row(label, value, wrap=70):
    global y
    lines = textwrap.wrap(value, wrap) or [""]
    need(14 * len(lines) + 4)
    c.setFont("Helvetica-Bold", 9); c.drawString(50, y, label)
    c.setFont("Helvetica", 9)
    for i, ln in enumerate(lines):
        c.drawString(230, y - i * 12, ln)
    y -= 12 * len(lines) + 4

c.setFont("Helvetica-Bold", 16); c.drawString(50, y, "Common App 2026-2027"); y -= 30
header("Profile")
row("First/given name:", "Priya")
row("Last/family/surname:", "Natarajan")
row("Address:", "2210 W Taylor St, Chicago, IL 60612")
header("Family")
row("Parent 1 Highest level of education:", "High school graduate")
header("Education")
row("Current or most recent secondary/high school:", "Walter Payton College Preparatory High School")
row("Date of entry:", "08/2023")
row("Graduation date:", "June 2027")
header("Grades")
row("Graduating class size (approx.):", "512")
row("Class rank reporting:", "Exact")
row("Class rank:", "21")
row("Cumulative GPA:", "4.48")
row("GPA scale:", "5")
row("GPA weighting:", "Weighted")
header("Current or Most Recent Year Courses")
for cl in ["AP Calculus BC", "AP Chemistry", "AP English Literature", "AP US Government", "IB HL Biology", "Honors Spanish IV"]:
    row("Course:", cl)
header("Testing")
row("Highest evidence-based reading and writing score:", "730")
row("Highest math score:", "770")
row("Highest composite score:", "34")
header("Honors")
row("Honors title:", "Regeneron ISEF Finalist, Biochemistry"); row("Grade level:", "11"); row("Level(s) of recognition:", "International")
row("Honors title:", "Illinois Junior Academy of Science Gold Award"); row("Grade level:", "10, 11"); row("Level(s) of recognition:", "State")
header("Activities")
acts = [
 ("Research", "Student Researcher, Northwestern Feinberg Lab", "Northwestern University", "Studied enzyme inhibitors for antibiotic resistance; co-author on regional poster; mentored 2 new students", "10, 11, 12", "15", "40"),
 ("Community Service (Volunteer)", "Founder & Director", "Pilsen Science Saturdays", "Founded free weekend science labs for 120 city middle schoolers across 3 libraries; raised $8,400 in grants", "9, 10, 11, 12", "6", "36"),
 ("Athletics: JV/Varsity", "Varsity Tennis, Co-Captain", "Payton Tennis", "Led team to conference title; organized summer clinics", "9, 10, 11, 12", "10", "16"),
]
for t, pos, org, desc, gl, hrs, wks in acts:
    row("Activity type:", t)
    row("Position/leadership description:", pos)
    row("Organization name:", org)
    row("Please describe this activity, including what you accomplished and any recognition you received, etc.:", desc, wrap=60)
    row("Participation grade levels:", gl)
    row("Timing of participation:", "During school year, During school break")
    row("Hours spent per week:", hrs)
    row("Weeks spent per year:", wks)
header("Future Plans")
row("Career interest:", "Biochemistry")
header("Writing")
c.setFont("Helvetica-Bold", 11); need(20); c.drawString(50, y, "Personal essay"); y -= 18
c.setFont("Helvetica", 9)
need(14); c.drawString(50, y, "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design."); y -= 20
essay = ("My grandmother kept her turmeric in a tin that once held Danish butter cookies, and for most of my childhood I believed the cookies were yellow. " * 3 +
 "When I finally opened the lab notebook my mentor handed me, I recognized the same feeling: the container is rarely what it seems. " * 4 +
 "Now I label everything twice, and I still ask what is really inside. " * 6).strip()
for para in [essay[:900], essay[900:]]:
    for ln in textwrap.wrap(para, 105):
        need(12); c.drawString(50, y, ln); y -= 12
    y -= 8
header("Additional information")
row("Do you wish to provide details of circumstances?", "No")
c.save()
print("ok", out)
