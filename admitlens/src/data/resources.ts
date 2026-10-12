// Official resources published by colleges and agencies. Every link points to the
// institution's own site. AdmitLens summarizes; it does not republish students' work.

export interface Resource {
  title: string;
  publisher: string;
  url: string;
  kind: "Essays that worked" | "Student blogs" | "From the admissions office" | "Applications & aid";
  takeaway: string;
}

export const RESOURCES: Resource[] = [
  {
    kind: "Essays that worked",
    title: "Essays That Worked",
    publisher: "Johns Hopkins University",
    url: "https://apply.jhu.edu/hopkins-insider/application-section/essays-that-worked",
    takeaway: "Each cycle the admissions committee nominates essays from admitted students and explains why each one stood out. Several years of examples are tagged by class.",
  },
  {
    kind: "Essays that worked",
    title: "College Essays That Worked",
    publisher: "Hamilton College",
    url: "https://www.hamilton.edu/admission/apply/college-essays-that-worked",
    takeaway: "Essays by current Hamilton students, alongside the office's own writing tips. The college says it values substance and voice over polish.",
  },
  {
    kind: "Essays that worked",
    title: "Essays That Worked",
    publisher: "Connecticut College",
    url: "https://www.conncoll.edu/admission/apply/essays-that-worked/",
    takeaway: "About eight recent student essays grouped by theme. The office tells applicants not to chase dramatic topics. It wants your own voice.",
  },
  {
    kind: "Student blogs",
    title: "MIT Admissions Blogs",
    publisher: "MIT Admissions",
    url: "https://mitadmissions.org/blogs/",
    takeaway: "Written by current MIT students (and some admissions staff) since 2004, with honest accounts of classes, research, and what applying felt like.",
  },
  {
    kind: "Student blogs",
    title: "Bulldogs' Blogs",
    publisher: "Yale Admissions",
    url: "https://admissions.yale.edu/bulldogs-blogs",
    takeaway: "Current Yale students write about residential colleges, academics, and campus life, including posts on applying from rural and first-generation backgrounds.",
  },
  {
    kind: "Student blogs",
    title: "Jumbo Talk",
    publisher: "Tufts Admissions",
    url: "https://admissions.tufts.edu/blogs/jumbo-talk",
    takeaway: "Student bloggers from different majors and countries, with admissions tips and a dedicated first-generation students category.",
  },
  {
    kind: "From the admissions office",
    title: "Decision FAQs",
    publisher: "Stanford Undergraduate Admission",
    url: "https://admission.stanford.edu/faqs/decision.html",
    takeaway: "Stanford names distinguished academic achievement and potential as its primary criteria, then intellectual vitality and sustained commitment outside class.",
  },
  {
    kind: "From the admissions office",
    title: "Counselor newsletter (Fall 2022)",
    publisher: "Harvard College Admissions",
    url: "https://college.harvard.edu/sites/default/files/2022-09/Harvard_CounselorNews_Fall2022.pdf",
    takeaway: "Harvard's own guidance to counselors, including that the committee may look favorably on evidence of overcoming significant obstacles.",
  },
  {
    kind: "Applications & aid",
    title: "2026–2027 Common App essay prompts",
    publisher: "Common App",
    url: "https://www.commonapp.org/blog/announcing-2026-2027-common-app-essay-prompts",
    takeaway: "The official announcement. The seven prompts carry over from last cycle, with a 650-word limit.",
  },
  {
    kind: "Applications & aid",
    title: "College Scorecard",
    publisher: "U.S. Department of Education",
    url: "https://collegescorecard.ed.gov",
    takeaway: "The federal source behind AdmitLens's live data: costs, graduation rates, and earnings for every accredited college.",
  },
  {
    kind: "Applications & aid",
    title: "FAFSA",
    publisher: "Federal Student Aid",
    url: "https://studentaid.gov",
    takeaway: "File the FAFSA to unlock federal, state, and most college aid. Some state grants run out, so file early.",
  },
];
