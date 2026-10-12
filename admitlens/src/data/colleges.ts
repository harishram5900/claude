// AdmitLens college dataset.
//
// Figures are drawn from each school's most recent public Common Data Set / admissions
// profile (Class of 2028–2029 cycles): overall admit rate, middle-50% SAT/ACT of enrolled
// students, average unweighted GPA where published (estimated from CDS GPA bands otherwise),
// test policy, and approximate sticker cost of attendance. Policies change every cycle —
// the UI always links students to the official admissions site to verify.
//
// Every other US four-year institution is reachable through the live College Scorecard
// search (src/app/api/scorecard), which converts Department of Education data into the same
// shape at request time.

export type TestPolicy = "required" | "optional" | "blind";
export type Control = "Public" | "Private";

export interface College {
  id: string;
  name: string;
  short: string;
  city: string;
  state: string;
  control: Control;
  enrollment: number; // undergrad
  admitRate: number; // 0–1, overall
  sat: [number, number] | null; // middle 50% composite
  act: [number, number] | null;
  gpa: number; // average unweighted GPA of admitted/enrolled students (est.)
  testPolicy: TestPolicy;
  coa: number; // approx. annual sticker cost of attendance, USD
  plans: { ed?: boolean; ed2?: boolean; ea?: boolean; rea?: boolean };
  earlyRate?: number; // early-round admit rate when published
  inStateFactor?: number; // publics: multiplier on odds for residents vs. overall
  considersLegacy: boolean;
  deadlines: { early?: string; rd: string };
  url: string;
  knownFor: string[]; // flagship programs / resources — used to judge "why us" essays
  values: string[]; // what the admissions office says it rewards
  supplements: string[]; // recurring supplement prompt themes
  source: "dataset" | "scorecard";
  verified?: Verified;
}

export interface Verified {
  cycle: string; // e.g. "Class of 2029"
  detail: string; // admits / applicants as reported
  source: string; // publication
  url: string;
  earlyFrom?: string; // when the early-round rate is from an earlier cycle than `cycle`
}

// Admit rates checked against the school or its student newspaper for the most recent
// fully reported cycle. Everything else uses the latest Common Data Set and is labeled as such.
const VERIFIED: Record<string, Verified> = {
  harvard: { cycle: "Class of 2029", detail: "2,003 admitted of 47,893 applicants", source: "The Harvard Crimson", url: "https://www.thecrimson.com/article/2025/10/23/admissions-data-class-2029/", earlyFrom: "Class of 2028" },
  yale: { cycle: "Class of 2029", detail: "2,308 admitted of 50,227 applicants; single-choice early action 10.8%", source: "Yale Daily News", url: "https://yaledailynews.com/?p=197607" },
  princeton: { cycle: "Class of 2029", detail: "~4.4% of 42,303 applicants (faculty memo)", source: "The Daily Princetonian", url: "https://www.dailyprincetonian.com/article/2025/09/princeton-news-adpol-university-admits-4-percent-of-applicants-class-of-2029" },
  columbia: { cycle: "Class of 2029", detail: "~2,946 admitted of 59,616 applicants (revised after Ivy Day)", source: "Columbia admissions, as reported", url: "https://undergrad.admissions.columbia.edu" },
  penn: { cycle: "Class of 2029", detail: "3,530 admitted of 72,544 applicants", source: "The Daily Pennsylvanian", url: "https://www.thedp.com/section/admissions" },
  brown: { cycle: "Class of 2029", detail: "2,418 admitted of 42,765 applicants; early decision 907 of 5,055", source: "The Brown Daily Herald", url: "https://www.browndailyherald.com/article/2025/03/brown-admits-565-of-applicants-to-class-of-2029" },
  dartmouth: { cycle: "Class of 2029", detail: "1,702 admitted of 28,230 applicants", source: "Dartmouth admissions, as reported", url: "https://admissions.dartmouth.edu" },
  mit: { cycle: "Class of 2029", detail: "1,324 admitted of 29,282 applicants; early action 721 of 12,053", source: "The Tech", url: "https://thetech.com/2025/01/09/2029-ea-results" },
  duke: { cycle: "Class of 2029", detail: "Overall 4.8%; early decision 12.8%", source: "The Chronicle", url: "https://dukechronicle.com/article/2025/04/duke-university-admission-rate-statistics-compared-to-ivy-plus-universities-class-of-2029-early-regular-decision" },
  uiuc: { cycle: "Fall 2025", detail: "36.6% overall acceptance rate", source: "The Daily Illini", url: "https://dailyillini.com/news-stories/university-news/academics-news/2025/09/11/ui-largest-freshman-class/" },
};

type Row = [
  id: string,
  name: string,
  short: string,
  city: string,
  state: string,
  control: "Pu" | "Pr",
  enrollment: number,
  admitPct: number,
  sat: string, // "1500-1580" or ""
  act: string, // "34-36" or ""
  gpa: number,
  policy: "R" | "O" | "B",
  coa: number,
  plans: string, // e.g. "ED,ED2", "REA", "EA"
  earlyPct: number | null,
  legacy: 0 | 1,
  early: string,
  rd: string,
  url: string,
  knownFor: string,
  values: string,
  supplements: string,
  inStateFactor?: number,
];

// prettier-ignore
const ROWS: Row[] = [
  ["harvard","Harvard University","Harvard","Cambridge","MA","Pr",7110,4.2,"1500-1580","34-36",3.94,"R",88000,"REA",8.7,1,"Nov 1","Jan 1","https://college.harvard.edu/admissions","House system;Harvard Innovation Labs;concentrations with no major declared until sophomore year;Harvard Kennedy School cross-registration;Radcliffe Institute","distinguishing excellence in at least one area;intellectual curiosity beyond the classroom;character and how you treat others;capacity to contribute to the house community","intellectual experience that shaped you;how life experiences will contribute to Harvard;how you hope to use your education;top 3 things roommates should know"],
  ["stanford","Stanford University","Stanford","Stanford","CA","Pr",7840,3.6,"1510-1570","34-35",3.95,"R",92000,"REA",9.0,1,"Nov 1","Jan 5","https://admission.stanford.edu","d.school;Stanford StartX;Bing Overseas Studies;interdisciplinary programs like Symbolic Systems;Silicon Valley proximity","intellectual vitality;personal context and what you did with it;extracurricular impact;authentic voice","what matters to you and why;letter to your future roommate;intellectual vitality;short-answer questions"],
  ["mit","Massachusetts Institute of Technology","MIT","Cambridge","MA","Pr",4580,4.5,"1520-1570","34-36",3.96,"R",86000,"EA",6.0,0,"Nov 1","Jan 5","https://mitadmissions.org","UROP undergraduate research;MIT Media Lab;maker culture and hackathons;MISTI global internships;Course 6 EECS","alignment with MIT mission;collaboration and cooperation;initiative and risk-taking;hands-on creativity;resilience","what field you want to study and why;how you have contributed to your community;challenge you faced;something you do for the pleasure of it"],
  ["yale","Yale University","Yale","New Haven","CT","Pr",6820,4.6,"1500-1580","33-35",3.95,"R",90000,"REA",10.8,1,"Nov 1","Jan 2","https://admissions.yale.edu","residential colleges;Directed Studies;Yale Center for Collaborative Arts and Media;shopping period;Grand Strategy","who is most likely to make the most of Yale's resources;who will contribute most to the Yale community;intellectual engagement;leadership in context","academic interest and why Yale;community you belong to;engagement with a pressing issue;short takes"],
  ["princeton","Princeton University","Princeton","Princeton","NJ","Pr",5800,4.4,"1500-1570","34-35",3.95,"R",88000,"REA",null,1,"Nov 1","Jan 1","https://admission.princeton.edu","senior thesis;independent work in junior year;no-loan financial aid;residential college system;Princeton in Service of humanity","service and civic engagement;independent scholarship;academic preparation;personal growth","your intended academic area;a time you engaged in a difficult conversation;how you will contribute to the community;more about you short answers"],
  ["columbia","Columbia University","Columbia","New York","NY","Pr",9100,4.9,"1500-1570","34-35",3.93,"O",92000,"ED",null,1,"Nov 1","Jan 1","https://undergrad.admissions.columbia.edu","the Core Curriculum;New York City as a classroom;Columbia Engineering;Barnard partnership;global centers","intellectual curiosity matched to the Core;engagement with New York City;diverse perspectives;resilience","list of books and readings you enjoyed;why Columbia;why your intended field;how you navigate perspectives different from your own"],
  ["caltech","California Institute of Technology","Caltech","Pasadena","CA","Pr",990,3.1,"1530-1580","35-36",3.97,"R",86000,"EA",null,0,"Nov 1","Jan 3","https://www.admissions.caltech.edu","SURF summer research;Honor Code;JPL;house system;core curriculum in math and physics","deep STEM curiosity;research and hands-on exploration;collaboration;integrity","STEM experience that sparked your curiosity;creative outlets;how you will add to the Caltech community"],
  ["brown","Brown University","Brown","Providence","RI","Pr",7400,5.7,"1510-1570","34-35",3.94,"R",88000,"ED",17.9,1,"Nov 1","Jan 3","https://admission.brown.edu","Open Curriculum;PLME program;Brown-RISD Dual Degree;Swearer Center;S/NC grading option","self-direction in learning;intellectual risk-taking;collaborative spirit;curiosity","why the Open Curriculum;what brings you joy;a community you belong to"],
  ["uchicago","University of Chicago","UChicago","Chicago","IL","Pr",7650,4.5,"1510-1570","34-35",3.95,"O",92000,"ED,ED2,EA",null,1,"Nov 1","Jan 6","https://collegeadmissions.uchicago.edu","the Core;Uncommon Essay prompts;Chicago Booth undergraduate courses;research with Nobel-winning faculty;Hyde Park","the life of the mind;intellectual playfulness and rigor;fit with UChicago's culture of inquiry;willingness to engage with weird questions","how UChicago meets your interests;Uncommon Essay with quirky prompts"],
  ["penn","University of Pennsylvania","Penn","Philadelphia","PA","Pr",10000,4.9,"1500-1570","34-35",3.93,"R",91000,"ED",14.2,1,"Nov 1","Jan 5","https://admissions.upenn.edu","Wharton;dual degree programs like M&T and Huntsman;Penn Engineering;One University cross-school courses;Netter Center","pre-professional and interdisciplinary purpose;community engagement in Philadelphia;fit with a specific undergraduate school;gratitude and character","thank-you note to someone;how you will explore community at Penn;why your specific undergraduate school"],
  ["dartmouth","Dartmouth College","Dartmouth","Hanover","NH","Pr",4500,6.0,"1500-1580","33-35",3.93,"R",89000,"ED",17.0,1,"Nov 1","Jan 2","https://admissions.dartmouth.edu","D-Plan quarter system;Dartmouth Outing Club;undergraduate-focused faculty;Thayer engineering;First-Year Trips","intellectual engagement;outdoorsy community spirit;character and kindness;leadership","why Dartmouth;what excites you about your community;choose one of several reflective prompts"],
  ["duke","Duke University","Duke","Durham","NC","Pr",6640,4.8,"1510-1570","34-35",3.94,"O",90000,"ED",12.8,1,"Nov 1","Jan 2","https://admissions.duke.edu","Bass Connections;DukeEngage;Pratt engineering;Research Triangle;Focus program","intellectual curiosity;personal qualities;community contribution;academic rigor","why Duke;optional prompts on beliefs, community, and identity"],
  ["cornell","Cornell University","Cornell","Ithaca","NY","Pr",16100,8.4,"1480-1560","33-35",3.92,"R",88000,"ED",17.0,1,"Nov 1","Jan 2","https://admissions.cornell.edu","college-specific admissions (CALS, Engineering, A&S, Dyson, Hotel, ILR, Human Ecology);land-grant mission;Cornell Tech","clear fit with the undergraduate college you apply to;any person, any study;public engagement","college-specific essay on why that college;community you belong to"],
  ["jhu","Johns Hopkins University","Johns Hopkins","Baltimore","MD","Pr",6100,6.4,"1530-1570","34-35",3.94,"R",88000,"ED,ED2",null,0,"Nov 1","Jan 2","https://apply.jhu.edu","undergraduate research from first year;Bloomberg School of Public Health;Applied Physics Lab;Hopkins Semester;Baltimore partnerships","research-mindedness;impact and initiative;collaboration;academic excellence","how an aspect of your identity or experience will contribute to Hopkins"],
  ["northwestern","Northwestern University","Northwestern","Evanston","IL","Pr",8800,7.2,"1500-1570","33-35",3.93,"O",90000,"ED",null,1,"Nov 1","Jan 2","https://admissions.northwestern.edu","Medill journalism;McCormick engineering;Bienen music;quarter system;Chicago proximity","interdisciplinary interests;community engagement;fit with a specific school;curiosity","why Northwestern;optional short answers on community and identity"],
  ["vanderbilt","Vanderbilt University","Vanderbilt","Nashville","TN","Pr",7300,5.1,"1510-1570","34-35",3.93,"O",90000,"ED,ED2",null,1,"Nov 1","Jan 1","https://admissions.vanderbilt.edu","Opportunity Vanderbilt no-loan aid;Blair School of Music;Peabody College;residential colleges;Nashville","leadership and engagement;intellectual curiosity;contribution to a diverse community","extracurricular or work experience;how you navigate disagreement"],
  ["rice","Rice University","Rice","Houston","TX","Pr",4600,7.9,"1510-1570","34-35",3.92,"O",78000,"ED",null,1,"Nov 1","Jan 4","https://admission.rice.edu","residential college system;Rice Investment Program;Texas Medical Center;Brown School of Engineering","culture of care;academic excellence;how you'll contribute to the residential colleges","why your field;why Rice;Box of images"],
  ["notredame","University of Notre Dame","Notre Dame","Notre Dame","IN","Pr",8900,11.3,"1440-1550","33-35",3.9,"O",88000,"REA",null,1,"Nov 1","Jan 2","https://admissions.nd.edu","Catholic intellectual tradition;Center for Social Concerns;study abroad;strong alumni network","faith and service;character;community","why Notre Dame;short essays on values and service"],
  ["washu","Washington University in St. Louis","WashU","St. Louis","MO","Pr",8100,12.0,"1510-1570","33-35",3.92,"O",88000,"ED,ED2",null,0,"Nov 1","Jan 2","https://admissions.wustl.edu","Olin Business School;Beyond Boundaries program;research culture;medical school","fit with chosen school;community impact;academics","why WashU and your academic interests"],
  ["georgetown","Georgetown University","Georgetown","Washington","DC","Pr",7900,12.9,"1410-1550","32-35",3.9,"R",88000,"EA",null,1,"Nov 1","Jan 10","https://uadmissions.georgetown.edu","School of Foreign Service;McDonough business;Washington DC internships;Jesuit values","service to others;global engagement;intellectual rigor;interview","interest in your school;activity essay;why Georgetown values"],
  ["emory","Emory University","Emory","Atlanta","GA","Pr",7200,10.3,"1460-1540","33-34",3.88,"O",85000,"ED,ED2",null,1,"Nov 1","Jan 1","https://apply.emory.edu","Oxford College;Goizueta business;CDC proximity;liberal arts within a research university","intellectual curiosity;reflection;community","academic interest;reflection on community"],
  ["cmu","Carnegie Mellon University","Carnegie Mellon","Pittsburgh","PA","Pr",7700,11.0,"1510-1560","34-35",3.9,"O",88000,"ED,ED2",null,0,"Nov 1","Jan 2","https://www.cmu.edu/admission","School of Computer Science;Robotics Institute;College of Fine Arts;Tepper;interdisciplinary BXA","demonstrated passion and talent;fit with chosen college;creativity","why the program you chose;what makes you stand out;interests outside your major"],
  ["ucla","University of California, Los Angeles","UCLA","Los Angeles","CA","Pu",33000,9.0,"","",3.95,"B",42000,"",null,0,"","Nov 30","https://admission.ucla.edu","Samueli engineering;School of Theater, Film & TV;Undergraduate Research Center;Pac/Big Ten athletics","academic achievement in context;Personal Insight Questions;persistence;contribution","four of eight Personal Insight Questions (350 words each)",1.4],
  ["berkeley","University of California, Berkeley","UC Berkeley","Berkeley","CA","Pu",33000,11.0,"","",3.94,"B",45000,"",null,0,"","Nov 30","https://admissions.berkeley.edu","College of Engineering;Haas;EECS;Berkeley SkyDeck;URAP research","academic excellence in context;intellectual independence;leadership;persistence","four of eight Personal Insight Questions (350 words each)",1.4],
  ["usc","University of Southern California","USC","Los Angeles","CA","Pr",21000,9.8,"1450-1550","32-35",3.88,"O",95000,"EA",null,1,"Nov 1","Jan 15","https://admission.usc.edu","Viterbi engineering;School of Cinematic Arts;Marshall;Trojan Network;Iovine and Young Academy","interdisciplinary interests;Trojan Family community;talent","why USC;short answers;quick takes"],
  ["tufts","Tufts University","Tufts","Medford","MA","Pr",6900,9.5,"1470-1540","33-35",3.9,"O",88000,"ED,ED2",null,1,"Nov 1","Jan 4","https://admissions.tufts.edu","Tisch College of Civic Life;Fletcher School;SMFA;engineering","civic engagement;intellectual curiosity;quirkiness","why Tufts;an identity or community essay"],
  ["umich","University of Michigan","Michigan","Ann Arbor","MI","Pu",33700,15.6,"1350-1530","31-34",3.9,"O",38000,"EA",null,0,"Nov 1","Feb 1","https://admissions.umich.edu","Ross School of Business;College of Engineering;LSA;UROP;huge alumni network","academic achievement;community;why Michigan specifically","community you belong to;why your chosen school or college",1.9],
  ["uva","University of Virginia","UVA","Charlottesville","VA","Pu",17500,16.3,"1410-1530","32-35",3.92,"O",40000,"ED,EA",null,0,"Nov 1","Jan 5","https://admission.virginia.edu","Honor System;Lawn rooms;McIntire;Jefferson Scholars;student self-governance","academic rigor;community contribution;honor","why UVA's specific school;short answers",1.9],
  ["unc","University of North Carolina at Chapel Hill","UNC","Chapel Hill","NC","Pu",20200,15.3,"1330-1500","29-34",3.9,"R",30000,"EA",null,0,"Oct 15","Jan 15","https://admissions.unc.edu","Morehead-Cain;Kenan-Flagler;research triangle;Carolina Covenant","academic excellence;character;contribution to NC","short answers on community and quality",2.6],
  ["nyu","New York University","NYU","New York","NY","Pr",29500,9.2,"1500-1570","33-35",3.88,"O",93000,"ED,ED2",null,1,"Nov 1","Jan 5","https://www.nyu.edu/admissions","global campuses (Abu Dhabi, Shanghai);Stern;Tisch;Courant Institute;NYC","global outlook;urban engagement;fit with school","why NYU (optional)"],
  ["bc","Boston College","Boston College","Chestnut Hill","MA","Pr",9600,15.0,"1450-1530","33-35",3.88,"R",88000,"ED,ED2",null,1,"Nov 1","Jan 2","https://www.bc.edu/admission","Jesuit formation;Carroll School of Management;PULSE program","men and women for others;intellectual and spiritual development","Jesuit-values essay"],
  ["bu","Boston University","Boston University","Boston","MA","Pr",18500,11.0,"1430-1530","32-34",3.88,"O",88000,"ED,ED2",null,1,"Nov 1","Jan 4","https://www.bu.edu/admissions","Kilachand Honors;Questrom;College of Engineering;study abroad","why BU;fit with school;community","why BU"],
  ["gatech","Georgia Institute of Technology","Georgia Tech","Atlanta","GA","Pu",19500,16.0,"1370-1530","31-35",3.95,"R",33000,"EA",null,0,"Oct 15","Jan 4","https://admission.gatech.edu","College of Computing;Create-X;co-op program;Atlanta tech scene","progress and service;rigor in math and science;fit with major","why your major at Georgia Tech",2.2],
  ["northeastern","Northeastern University","Northeastern","Boston","MA","Pr",20000,5.6,"1460-1550","33-35",3.88,"O",90000,"ED,ED2,EA",null,1,"Nov 1","Jan 1","https://admissions.northeastern.edu","co-op program;experiential learning;N.U.in program","experiential learners;why Northeastern","why Northeastern (optional)"],
  ["williams","Williams College","Williams","Williamstown","MA","Pr",2100,10.0,"1500-1560","34-35",3.94,"O",88000,"ED",null,1,"Nov 15","Jan 8","https://admission.williams.edu","tutorial system;Winter Study;Williams-Mystic;Berkshires","intellectual engagement in small classes;community","community and conversation prompts"],
  ["amherst","Amherst College","Amherst","Amherst","MA","Pr",1950,9.0,"1500-1560","34-35",3.93,"O",88000,"ED",null,0,"Nov 1","Jan 1","https://www.amherst.edu/admission","Open Curriculum;Five College Consortium;no legacy preference","intellectual daring;community","personal reflection prompts"],
  ["pomona","Pomona College","Pomona","Claremont","CA","Pr",1800,6.6,"1470-1560","33-35",3.92,"O",88000,"ED,ED2",null,1,"Nov 1","Jan 8","https://www.pomona.edu/admissions","Claremont Colleges consortium;faculty-mentored research;Pomona Oldenborg","intellectual curiosity;community impact","why Pomona;short answers"],
  ["swarthmore","Swarthmore College","Swarthmore","Swarthmore","PA","Pr",1650,7.5,"1490-1560","33-35",3.93,"O",86000,"ED,ED2",null,1,"Nov 15","Jan 4","https://www.swarthmore.edu/admissions-aid","Honors Program with external examiners;Tri-College Consortium;engineering within liberal arts","intellectual intensity;social responsibility","why Swarthmore"],
  ["bowdoin","Bowdoin College","Bowdoin","Brunswick","ME","Pr",1950,7.0,"1480-1550","33-35",3.9,"O",86000,"ED,ED2",null,1,"Nov 15","Jan 5","https://www.bowdoin.edu/admissions","Offer of the College;Coastal Studies Center;outing club","common good;community","Offer of the College reflection"],
  ["barnard","Barnard College","Barnard","New York","NY","Pr",3200,8.8,"1460-1550","33-35",3.9,"O",92000,"ED",null,1,"Nov 1","Jan 1","https://barnard.edu/admissions","Columbia partnership;women's leadership;NYC","intellectual risk-taking;voice","why Barnard;women's college reflection"],
  ["cmc","Claremont McKenna College","Claremont McKenna","Claremont","CA","Pr",1400,11.0,"1450-1550","32-35",3.9,"O",88000,"ED,ED2",null,1,"Nov 15","Jan 5","https://www.cmc.edu/admission","research institutes;leadership;economics and government;Athenaeum","leadership;engagement with policy","why CMC"],
  ["harveymudd","Harvey Mudd College","Harvey Mudd","Claremont","CA","Pr",920,13.0,"1500-1560","34-35",3.93,"O",90000,"ED,ED2",null,1,"Nov 15","Jan 5","https://www.hmc.edu/admission","Clinic program;STEM with humanities core;Claremont Colleges","STEM aptitude;collaboration;impact on society","why Mudd;STEM and society"],
  ["tulane","Tulane University","Tulane","New Orleans","LA","Pr",8600,13.0,"1430-1520","32-34",3.7,"O",88000,"ED,ED2,EA",null,1,"Nov 1","Jan 15","https://admission.tulane.edu","public service graduation requirement;New Orleans;Newcomb-Tulane","demonstrated interest;community service","why Tulane"],
  ["wakeforest","Wake Forest University","Wake Forest","Winston-Salem","NC","Pr",5500,22.0,"1380-1510","31-34",3.85,"O",88000,"ED,ED2,EA",null,1,"Nov 15","Jan 1","https://admissions.wfu.edu","small classes;School of Business;Pro Humanitate","character;interview","top ten list;why Wake"],
  ["villanova","Villanova University","Villanova","Villanova","PA","Pr",7000,23.0,"1380-1490","31-34",3.85,"O",87000,"ED,ED2,EA",null,1,"Nov 1","Jan 15","https://admission.villanova.edu","Augustinian values;Villanova School of Business","community and service","Augustinian values essay"],
  ["uiuc","University of Illinois Urbana-Champaign","UIUC","Champaign","IL","Pu",37000,36.6,"1350-1520","29-34",3.85,"O",36000,"EA",null,0,"Nov 1","Jan 5","https://admissions.illinois.edu","Grainger Engineering;Siebel School of Computing;Gies Business;Research Park","fit with selected major;academic preparation in major-related courses","why your first-choice major;second-choice major",1.15],
  ["uic","University of Illinois Chicago","UIC","Chicago","IL","Pu",22000,79.0,"1010-1230","20-27",3.4,"O",31000,"EA",null,0,"Nov 1","Jan 15","https://admissions.uic.edu","Honors College;Guaranteed Professional Program Admissions (GPPA);College of Engineering;health sciences;Chicago location","academic readiness (GPA and course rigor);fit with major;persistence","optional essay, required for Honors College and GPPA",1.05],
  ["utaustin","University of Texas at Austin","UT Austin","Austin","TX","Pu",42000,27.0,"1230-1480","27-33",3.8,"R",33000,"EA",null,0,"Oct 15","Dec 1","https://admissions.utexas.edu","McCombs;Cockrell engineering;Plan II Honors;automatic admission for top Texas students","major-specific preparation;leadership;Texas automatic admit (top 6%)","why your major;leadership;short answers",1.6],
  ["wisconsin","University of Wisconsin–Madison","Wisconsin","Madison","WI","Pu",37000,43.0,"1350-1490","27-32",3.85,"O",33000,"EA",null,0,"Nov 1","Feb 1","https://admissions.wisc.edu","Wisconsin Idea;research university;Big Ten","academic preparation;why UW","why UW–Madison",1.2],
  ["purdue","Purdue University","Purdue","West Lafayette","IN","Pu",39000,50.0,"1190-1430","26-33",3.75,"R",30000,"EA",null,0,"Nov 1","Jan 15","https://admissions.purdue.edu","engineering;Purdue Polytechnic;tuition freeze;aviation","major readiness","why your major;Purdue short answers",1.1],
  ["osu","The Ohio State University","Ohio State","Columbus","OH","Pu",46000,51.0,"1250-1420","27-32",3.8,"O",33000,"EA",null,0,"Nov 1","Feb 1","https://undergrad.osu.edu","Fisher business;Honors and Scholars;Columbus","academic preparation","optional",1.2],
  ["pennstate","Pennsylvania State University","Penn State","University Park","PA","Pu",42000,54.0,"1160-1360","25-30",3.6,"O",34000,"EA",null,0,"Nov 1","Feb 1","https://admissions.psu.edu","Schreyer Honors;THON;2+2 campus plan","academic preparation","optional essay",1.2],
  ["rutgers","Rutgers University–New Brunswick","Rutgers","New Brunswick","NJ","Pu",37000,65.0,"1240-1460","26-32",3.6,"O",33000,"EA",null,0,"Nov 1","Jan 15","https://admissions.rutgers.edu","Big Ten research;NYC proximity;Honors College","academic preparation","optional",1.1],
  ["umd","University of Maryland, College Park","UMD","College Park","MD","Pu",30800,44.0,"1340-1500","30-34",3.8,"O",33000,"EA",null,0,"Nov 1","Jan 20","https://admissions.umd.edu","Honors College;Living-learning programs;DC proximity","academic rigor;community","short answers",1.3],
  ["uf","University of Florida","UF","Gainesville","FL","Pu",35000,24.0,"1330-1470","29-33",3.9,"R",23000,"",null,0,"","Nov 1","https://admissions.ufl.edu","Florida Bright Futures;engineering;Warrington","academic rigor;personal statement","personal essay",1.5],
  ["fsu","Florida State University","Florida State","Tallahassee","FL","Pu",33000,25.0,"1250-1390","27-31",3.85,"R",23000,"EA",null,0,"Oct 15","Dec 1","https://admissions.fsu.edu","Honors;College of Business","academic rigor","optional essay",1.4],
  ["uga","University of Georgia","UGA","Athens","GA","Pu",31000,37.0,"1260-1430","28-33",3.9,"O",30000,"EA",null,0,"Oct 15","Jan 1","https://admissions.uga.edu","Honors Program;Terry College;Georgia HOPE","academic rigor;character","short essay",1.4],
  ["vt","Virginia Tech","Virginia Tech","Blacksburg","VA","Pu",30500,57.0,"1220-1410","26-32",3.85,"O",32000,"ED,EA",null,0,"Nov 1","Jan 15","https://vt.edu/admissions","engineering;Corps of Cadets;Ut Prosim service","service;fit with major","Ut Prosim short answers",1.2],
  ["tamu","Texas A&M University","Texas A&M","College Station","TX","Pu",57000,63.0,"1140-1370","25-31",3.7,"O",30000,"",null,0,"","Dec 1","https://admissions.tamu.edu","engineering;Corps of Cadets;Aggie network","academic preparation;leadership","short answers",1.2],
  ["ucsd","University of California, San Diego","UC San Diego","La Jolla","CA","Pu",33000,25.0,"","",3.9,"B",40000,"",null,0,"","Nov 30","https://admissions.ucsd.edu","Jacobs engineering;Scripps Institution of Oceanography;college system","academic excellence in context;persistence","four of eight Personal Insight Questions",1.3],
  ["ucdavis","University of California, Davis","UC Davis","Davis","CA","Pu",32000,42.0,"","",3.8,"B",40000,"",null,0,"","Nov 30","https://www.ucdavis.edu/admissions","agriculture and environmental sciences;vet med;engineering","academic excellence in context","four of eight Personal Insight Questions",1.3],
  ["uci","University of California, Irvine","UC Irvine","Irvine","CA","Pu",29000,26.0,"","",3.9,"B",40000,"",null,0,"","Nov 30","https://admissions.uci.edu","computer science;biological sciences;Anteater ethos","academic excellence in context","four of eight Personal Insight Questions",1.3],
  ["ucsb","University of California, Santa Barbara","UC Santa Barbara","Santa Barbara","CA","Pu",23000,33.0,"","",3.9,"B",42000,"",null,0,"","Nov 30","https://admissions.sa.ucsb.edu","College of Creative Studies;engineering;marine science","academic excellence in context","four of eight Personal Insight Questions",1.3],
  ["asu","Arizona State University","ASU","Tempe","AZ","Pu",65000,90.0,"1120-1360","21-28",3.5,"O",32000,"",null,0,"","Rolling","https://admission.asu.edu","Barrett Honors College;innovation rankings;online flexibility","core competencies met","none",1.0],
  ["arizona","University of Arizona","Arizona","Tucson","AZ","Pu",40000,86.0,"1130-1370","21-29",3.5,"O",32000,"",null,0,"","May 1","https://admissions.arizona.edu","optical sciences;space science;honors college","core competencies met","none",1.0],
  ["msu","Michigan State University","Michigan State","East Lansing","MI","Pu",40000,84.0,"1100-1300","23-29",3.6,"O",33000,"EA",null,0,"Nov 1","Rolling","https://admissions.msu.edu","James Madison College;agriculture;Broad business","academic preparation","optional",1.0],
  ["indiana","Indiana University Bloomington","Indiana","Bloomington","IN","Pu",37000,80.0,"1170-1380","25-31",3.7,"O",31000,"EA",null,0,"Nov 1","Feb 1","https://admissions.indiana.edu","Kelley School of Business;Jacobs School of Music;Hutton Honors","academic preparation","short essay",1.0],
  ["iowa","University of Iowa","Iowa","Iowa City","IA","Pu",22000,86.0,"1150-1350","21-28",3.7,"O",30000,"",null,0,"","May 1","https://admissions.uiowa.edu","Writers' Workshop;health care;Hawkeyes","regent admission index","none",1.0],
  ["umn","University of Minnesota Twin Cities","Minnesota","Minneapolis","MN","Pu",39000,75.0,"1250-1460","24-30",3.75,"O",30000,"",null,0,"","Jan 1","https://admissions.tc.umn.edu","Carlson business;College of Science & Engineering;Twin Cities","academic preparation","optional short answers",1.1],
  ["illinoisstate","Illinois State University","Illinois State","Normal","IL","Pu",18000,89.0,"990-1190","19-25",3.4,"O",28000,"",null,0,"","Rolling","https://illinoisstate.edu/admissions","teacher education;Honors Program;affordable","academic readiness","none",1.0],
  ["luc","Loyola University Chicago","Loyola Chicago","Chicago","IL","Pr",12000,83.0,"1140-1320","24-30",3.7,"O",68000,"EA",null,1,"Dec 1","Rolling","https://www.luc.edu/undergrad","Jesuit education;nursing;Lake Shore campus","service;academic readiness","optional essay"],
  ["depaul","DePaul University","DePaul","Chicago","IL","Pr",13500,78.0,"1080-1300","22-29",3.6,"O",62000,"EA",null,0,"Nov 15","Feb 1","https://www.depaul.edu/admission","Theatre School;Kellstadt business;Chicago Loop","service;academic readiness","short essay"],
  ["howard","Howard University","Howard","Washington","DC","Pr",11000,35.0,"1100-1260","22-27",3.6,"O",55000,"ED,EA",null,1,"Nov 1","Feb 15","https://howard.edu/admission","HBCU leadership tradition;College of Medicine;Washington DC","leadership;service;truth and service mission","personal statement"],
  ["spelman","Spelman College","Spelman","Atlanta","GA","Pr",2400,28.0,"1100-1250","22-27",3.8,"O",52000,"ED,EA",null,1,"Nov 1","Feb 1","https://www.spelman.edu/admissions","HBCU women's college;STEM pipeline;Atlanta University Center","leadership;service","short answers"],
  ["morehouse","Morehouse College","Morehouse","Atlanta","GA","Pr",2300,58.0,"1010-1200","19-25",3.3,"O",54000,"EA",null,1,"Nov 1","Feb 15","https://morehouse.edu/admissions","HBCU men's college;leadership development;Atlanta University Center","leadership;character","personal essay"],
  ["cwru","Case Western Reserve University","Case Western","Cleveland","OH","Pr",6000,27.0,"1410-1530","32-35",3.85,"O",85000,"ED,ED2,EA",null,1,"Nov 1","Jan 15","https://case.edu/admission","engineering;Pre-Professional Scholars;Cleveland Clinic","research interest;fit","why CWRU"],
  ["rochester","University of Rochester","Rochester","Rochester","NY","Pr",6700,36.0,"1360-1530","31-34",3.8,"O",88000,"ED,ED2",null,1,"Nov 1","Jan 5","https://enrollment.rochester.edu/admissions","Open curriculum;Eastman School of Music;optics","intellectual independence","why Rochester"],
  ["brandeis","Brandeis University","Brandeis","Waltham","MA","Pr",3700,39.0,"1350-1520","30-34",3.8,"O",88000,"ED,ED2",null,1,"Nov 1","Jan 1","https://www.brandeis.edu/admissions","social justice;research university feel of a liberal arts college","social justice;curiosity","short essay"],
  ["pitt","University of Pittsburgh","Pitt","Pittsburgh","PA","Pu",20000,50.0,"1250-1420","28-32",3.85,"O",38000,"",null,0,"","Rolling","https://oafa.pitt.edu","Guaranteed admissions to grad programs;engineering;health sciences","academic preparation","optional",1.1],
  ["clemson","Clemson University","Clemson","Clemson","SC","Pu",23000,43.0,"1200-1360","27-32",3.85,"O",33000,"",null,0,"","May 1","https://www.clemson.edu/admissions","engineering;agriculture;Calhoun Honors","academic preparation","short answer",1.2],
  ["alabama","University of Alabama","Alabama","Tuscaloosa","AL","Pu",34000,76.0,"1130-1350","23-31",3.7,"O",34000,"",null,0,"","Rolling","https://gobama.ua.edu","Honors College;merit scholarships;Culverhouse","academic preparation","none",1.0],
  ["auburn","Auburn University","Auburn","Auburn","AL","Pu",26000,49.0,"1200-1360","25-31",3.8,"O",35000,"EA",null,0,"Nov 1","Feb 1","https://www.auburn.edu/admissions","engineering;veterinary medicine;Auburn family","academic preparation","none",1.1],
  ["baylor","Baylor University","Baylor","Waco","TX","Pr",15000,52.0,"1210-1390","26-32",3.7,"O",78000,"ED,EA",null,1,"Nov 1","Feb 1","https://admissions.web.baylor.edu","Christian mission;Hankamer business;health sciences","faith and service","short answer"],
  ["smu","Southern Methodist University","SMU","Dallas","TX","Pr",7000,52.0,"1340-1500","30-33",3.7,"O",88000,"ED,ED2,EA",null,1,"Nov 1","Jan 15","https://www.smu.edu/admission","Cox business;Meadows arts;Dallas","engagement","short essay"],
  ["cuboulder","University of Colorado Boulder","CU Boulder","Boulder","CO","Pu",31000,81.0,"1160-1370","25-31",3.6,"O",38000,"EA",null,0,"Nov 1","Jan 15","https://www.colorado.edu/admissions","aerospace engineering;environmental science;Boulder","academic preparation","short essay",1.0],
  ["uw","University of Washington","UW","Seattle","WA","Pu",36000,43.0,"1250-1470","28-33",3.85,"O",38000,"",null,0,"","Nov 15","https://admit.washington.edu","Paul G. Allen School of CSE;medicine;Seattle tech","academic achievement in context;personal statement","personal statement;short response",1.6],
  ["oregon","University of Oregon","Oregon","Eugene","OR","Pu",19000,86.0,"1110-1330","22-29",3.6,"O",33000,"EA",null,0,"Nov 1","Jan 15","https://admissions.uoregon.edu","Clark Honors College;journalism;sports product design","academic preparation","personal essay",1.0],
  ["utah","University of Utah","Utah","Salt Lake City","UT","Pu",27000,87.0,"1140-1380","22-29",3.7,"O",28000,"",null,0,"","Apr 1","https://admissions.utah.edu","Honors College;entrepreneurship;Wasatch outdoors","academic preparation","none",1.0],
  ["byu","Brigham Young University","BYU","Provo","UT","Pr",31000,59.0,"1210-1410","26-31",3.86,"R",21000,"",null,0,"","Dec 15","https://enrollment.byu.edu","Marriott business;accounting;languages","ecclesiastical endorsement;character","short answers"],
  ["stonybrook","Stony Brook University","Stony Brook","Stony Brook","NY","Pu",18000,49.0,"1320-1480","28-33",3.8,"O",33000,"EA",null,0,"Nov 15","Jan 15","https://www.stonybrook.edu/admissions","research;honors college;Simons Center","academic preparation","personal essay",1.1],
  ["binghamton","Binghamton University","Binghamton","Vestal","NY","Pu",14000,39.0,"1350-1480","30-33",3.8,"O",30000,"EA",null,0,"Nov 15","Jan 15","https://www.binghamton.edu/admissions","School of Management;Harpur College;SUNY flagship-level outcomes","academic preparation","personal essay",1.1],
  ["buffalo","University at Buffalo","Buffalo","Buffalo","NY","Pu",21000,69.0,"1170-1350","23-29",3.6,"O",30000,"EA",null,0,"Nov 1","Feb 1","https://admissions.buffalo.edu","engineering;pharmacy;Honors College","academic preparation","optional",1.0],
  ["syracuse","Syracuse University","Syracuse","Syracuse","NY","Pr",15500,42.0,"1250-1410","27-32",3.7,"O",88000,"ED",null,1,"Nov 15","Jan 5","https://admissions.syr.edu","Newhouse communications;Whitman;iSchool","fit with college","why Syracuse"],
  ["fordham","Fordham University","Fordham","Bronx","NY","Pr",10000,54.0,"1310-1460","30-33",3.7,"O",85000,"ED,EA",null,1,"Nov 1","Jan 1","https://www.fordham.edu/admission","Jesuit education;Gabelli business;Lincoln Center","service","short essay"],
  ["rpi","Rensselaer Polytechnic Institute","RPI","Troy","NY","Pr",5800,65.0,"1320-1500","29-34",3.8,"O",85000,"ED,ED2",null,1,"Nov 1","Jan 15","https://admissions.rpi.edu","engineering;game design;Arch summer","STEM fit","why RPI"],
  ["wpi","Worcester Polytechnic Institute","WPI","Worcester","MA","Pr",5300,58.0,"1310-1480","29-34",3.9,"O",82000,"ED,ED2,EA",null,1,"Nov 1","Jan 15","https://www.wpi.edu/admissions","project-based curriculum;Global Projects Program","hands-on learning","optional"],
  ["drexel","Drexel University","Drexel","Philadelphia","PA","Pr",14000,78.0,"1180-1390","25-31",3.6,"O",80000,"ED,EA",null,1,"Nov 1","Jan 15","https://drexel.edu/admissions","co-op;engineering;nursing","experiential learning","optional"],
  ["temple","Temple University","Temple","Philadelphia","PA","Pu",27000,83.0,"1110-1310","21-28",3.5,"O",42000,"EA",null,0,"Nov 1","Feb 1","https://admissions.temple.edu","Fox School;Klein media;Philadelphia","academic preparation","optional",1.0],
  ["miami","University of Miami","Miami","Coral Gables","FL","Pr",12500,19.0,"1350-1480","31-33",3.8,"O",88000,"ED,ED2,EA",null,1,"Nov 1","Jan 1","https://admissions.miami.edu","marine science;Frost School of Music;Miami","community engagement","why Miami"],
  ["ucf","University of Central Florida","UCF","Orlando","FL","Pu",60000,41.0,"1200-1350","25-30",3.9,"R",23000,"",null,0,"","May 1","https://www.ucf.edu/admissions","engineering;hospitality;simulation","academic preparation","none",1.3],
  ["usf","University of South Florida","USF","Tampa","FL","Pu",38000,41.0,"1240-1380","26-31",3.9,"R",23000,"",null,0,"","Mar 1","https://www.usf.edu/admissions","health;marine science;Judy Genshaft Honors","academic preparation","none",1.3],
  ["uh","University of Houston","Houston","Houston","TX","Pu",39000,72.0,"1140-1320","22-27",3.5,"O",27000,"",null,0,"","May 1","https://uh.edu/admissions","Honors College;engineering;Bauer","academic preparation","none",1.0],
  ["utd","University of Texas at Dallas","UT Dallas","Richardson","TX","Pu",21000,85.0,"1240-1470","26-32",3.7,"O",30000,"",null,0,"","May 1","https://enroll.utdallas.edu","engineering and CS;Collegium V Honors;research","academic preparation","none",1.0],
  ["calpoly","California Polytechnic State University, San Luis Obispo","Cal Poly SLO","San Luis Obispo","CA","Pu",21000,33.0,"","",3.95,"B",35000,"",null,0,"","Nov 30","https://admissions.calpoly.edu","Learn by Doing;engineering;agriculture;architecture","major-specific preparation;extracurriculars","none",1.3],
  ["sdsu","San Diego State University","San Diego State","San Diego","CA","Pu",31000,39.0,"","",3.85,"B",34000,"",null,0,"","Nov 30","https://admissions.sdsu.edu","business;public health;Honors College","academic preparation","none",1.3],
  ["sjsu","San José State University","San José State","San Jose","CA","Pu",28000,79.0,"","",3.5,"B",33000,"",null,0,"","Nov 30","https://www.sjsu.edu/admissions","Silicon Valley;engineering;Lurie College of Education","academic preparation","none",1.0],
  ["mines","Colorado School of Mines","Colorado Mines","Golden","CO","Pu",5800,58.0,"1300-1460","28-33",3.85,"O",42000,"EA",null,0,"Nov 1","Jan 15","https://www.mines.edu/admissions","engineering;energy;earth sciences","STEM preparation","optional",1.0],
  ["tennessee","University of Tennessee, Knoxville","Tennessee","Knoxville","TN","Pu",30000,46.0,"1180-1340","25-31",3.9,"O",33000,"EA",null,0,"Nov 1","Dec 15","https://admissions.utk.edu","Haslam business;Oak Ridge partnership","academic preparation","none",1.2],
  ["southcarolina","University of South Carolina","South Carolina","Columbia","SC","Pu",30000,61.0,"1200-1380","26-31",3.75,"O",33000,"EA",null,0,"Oct 15","Jan 15","https://sc.edu/admissions","international business;South Carolina Honors College","academic preparation","none",1.1],
  ["uconn","University of Connecticut","UConn","Storrs","CT","Pu",19000,55.0,"1230-1430","26-32",3.8,"O",37000,"EA",null,0,"Dec 1","Jan 15","https://admissions.uconn.edu","Honors;engineering;athletics","academic preparation","personal essay",1.1],
  ["umass","University of Massachusetts Amherst","UMass Amherst","Amherst","MA","Pu",24000,58.0,"1270-1450","28-33",3.9,"O",37000,"EA",null,0,"Nov 5","Jan 15","https://www.umass.edu/admissions","Commonwealth Honors College;Five College Consortium;computer science","academic preparation","personal essay",1.1],
  ["missouri","University of Missouri","Mizzou","Columbia","MO","Pu",24000,77.0,"1120-1330","23-29",3.6,"O",30000,"",null,0,"","Rolling","https://admissions.missouri.edu","School of Journalism;Honors","academic preparation","none",1.0],
  ["kansas","University of Kansas","Kansas","Lawrence","KS","Pu",20000,88.0,"1090-1310","21-28",3.6,"O",30000,"",null,0,"","Rolling","https://admissions.ku.edu","pharmacy;Honors;architecture","academic preparation","none",1.0],
  ["oklahoma","University of Oklahoma","Oklahoma","Norman","OK","Pu",23000,77.0,"1120-1340","22-29",3.6,"O",30000,"",null,0,"","Feb 1","https://ou.edu/admissions","meteorology;Price business;Honors College","academic preparation","short essay",1.0],
  ["kentucky","University of Kentucky","Kentucky","Lexington","KY","Pu",23000,95.0,"1070-1300","21-28",3.6,"O",30000,"",null,0,"","Feb 15","https://admission.uky.edu","Lewis Honors;equine;health sciences","academic preparation","none",1.0],
  ["lsu","Louisiana State University","LSU","Baton Rouge","LA","Pu",32000,75.0,"1080-1300","22-28",3.5,"O",30000,"",null,0,"","Apr 15","https://www.lsu.edu/admissions","petroleum engineering;Ogden Honors","academic preparation","none",1.0],
  ["nebraska","University of Nebraska–Lincoln","Nebraska","Lincoln","NE","Pu",20000,79.0,"1080-1320","21-28",3.6,"O",28000,"",null,0,"","May 1","https://admissions.unl.edu","Raikes School;agriculture;Honors","academic preparation","none",1.0],
  ["delaware","University of Delaware","Delaware","Newark","DE","Pu",19000,69.0,"1200-1360","26-31",3.6,"O",36000,"EA",null,0,"Nov 15","Jan 15","https://www.udel.edu/apply/undergraduate-admissions","chemical engineering;Honors College;study abroad pioneer","academic preparation","personal essay",1.1],
  ["vermont","University of Vermont","Vermont","Burlington","VT","Pu",11500,60.0,"1220-1390","27-32",3.6,"O",40000,"ED,EA",null,0,"Nov 1","Jan 15","https://www.uvm.edu/admissions","environmental studies;nursing;Burlington","academic preparation","personal essay",1.1],
  ["westpoint","United States Military Academy","West Point","West Point","NY","Pu",4500,11.0,"1250-1470","26-32",3.8,"R",0,"",null,0,"","Jan 31","https://www.westpoint.edu/admissions","leadership development;engineering;Army commission","leadership;physical fitness;congressional nomination;character","nomination process;leadership essays",1.0],
  ["navy","United States Naval Academy","Naval Academy","Annapolis","MD","Pu",4500,8.0,"1270-1460","26-33",3.8,"R",0,"",null,0,"","Jan 31","https://www.usna.edu/admissions","leadership;engineering;Navy/Marine commission","leadership;physical fitness;congressional nomination;character","nomination;personal statements",1.0],
  ["airforce","United States Air Force Academy","Air Force Academy","Colorado Springs","CO","Pu",4300,11.0,"1250-1450","27-33",3.8,"R",0,"",null,0,"","Dec 31","https://www.academyadmissions.com","aeronautical engineering;leadership;Air & Space Force commission","leadership;fitness;nomination;character","nomination;writing samples",1.0],
  ["middlebury","Middlebury College","Middlebury","Middlebury","VT","Pr",2800,11.0,"1440-1540","32-34",3.9,"O",88000,"ED,ED2",null,1,"Nov 1","Jan 1","https://www.middlebury.edu/college/admissions","language schools;environmental studies;Bread Loaf","intellectual curiosity;global outlook","short essay"],
  ["wellesley","Wellesley College","Wellesley","Wellesley","MA","Pr",2400,14.0,"1440-1550","32-34",3.9,"O",88000,"ED,ED2",null,1,"Nov 1","Jan 8","https://www.wellesley.edu/admission","women's leadership;MIT cross-registration;alumnae network","women who will make a difference","why Wellesley"],
  ["davidson","Davidson College","Davidson","Davidson","NC","Pr",2000,13.0,"1390-1500","31-34",3.9,"O",80000,"ED,ED2",null,1,"Nov 15","Jan 5","https://www.davidson.edu/admission-and-financial-aid","Honor Code;Davidson Trust no-loan aid;liberal arts","character;community","why Davidson"],
  ["colby","Colby College","Colby","Waterville","ME","Pr",2300,7.0,"1450-1540","33-34",3.9,"O",88000,"ED,ED2",null,1,"Nov 15","Jan 1","https://www.colby.edu/admission","DavisConnects;Lunder arts;Maine","engagement","optional"],
  ["wesleyan","Wesleyan University","Wesleyan","Middletown","CT","Pr",3100,16.0,"1410-1520","32-34",3.85,"O",90000,"ED,ED2",null,0,"Nov 15","Jan 1","https://www.wesleyan.edu/admission","film studies;open curriculum;Patricelli Center","creativity;independence","why Wesleyan"],
  ["hamilton","Hamilton College","Hamilton","Clinton","NY","Pr",2000,12.0,"1440-1530","33-34",3.9,"O",88000,"ED,ED2",null,1,"Nov 15","Jan 1","https://www.hamilton.edu/admission","writing-intensive curriculum;open curriculum;oral communication","intellectual curiosity","optional"],
  ["vassar","Vassar College","Vassar","Poughkeepsie","NY","Pr",2450,18.0,"1430-1530","32-34",3.9,"O",88000,"ED,ED2",null,1,"Nov 15","Jan 1","https://www.vassar.edu/admission","open curriculum;arts;Hudson Valley","intellectual independence","why Vassar"],
  ["grinnell","Grinnell College","Grinnell","Grinnell","IA","Pr",1700,13.0,"1400-1530","31-34",3.85,"O",85000,"ED,ED2",null,1,"Nov 15","Jan 15","https://www.grinnell.edu/admission","individually advised curriculum;social justice;generous aid","self-governance;social responsibility","optional"],
  ["carleton","Carleton College","Carleton","Northfield","MN","Pr",2050,22.0,"1430-1540","32-34",3.85,"O",85000,"ED,ED2",null,1,"Nov 15","Jan 15","https://www.carleton.edu/admissions","comps senior project;trimester;undergraduate teaching","intellectual curiosity","why Carleton"],
  ["lehigh","Lehigh University","Lehigh","Bethlehem","PA","Pr",5900,29.0,"1340-1480","30-33",3.8,"O",85000,"ED,ED2",null,1,"Nov 1","Jan 1","https://www1.lehigh.edu/admissions","engineering;Integrated Business & Engineering;Mountaintop","engagement","why Lehigh"],
  ["stevens","Stevens Institute of Technology","Stevens","Hoboken","NJ","Pr",4100,46.0,"1380-1510","31-34",3.85,"O",82000,"ED,ED2",null,1,"Nov 15","Jan 15","https://www.stevens.edu/admission-aid","engineering;quantitative finance;NYC proximity","STEM fit","optional"],
  ["gwu","George Washington University","GW","Washington","DC","Pr",11500,44.0,"1330-1490","31-34",3.7,"O",88000,"ED,ED2",null,1,"Nov 1","Jan 5","https://undergraduate.admissions.gwu.edu","Elliott School of International Affairs;political science;DC internships","engagement with public life","optional"],
  ["american","American University","American","Washington","DC","Pr",8000,47.0,"1270-1420","28-32",3.6,"O",80000,"ED,ED2,EA",null,1,"Nov 15","Jan 15","https://www.american.edu/admissions","School of International Service;Washington Semester","civic engagement","optional"],
  ["uwm","University of Wisconsin–Milwaukee","UW–Milwaukee","Milwaukee","WI","Pu",18000,89.0,"","18-24",3.2,"O",25000,"",null,0,"","Rolling","https://uwm.edu/admission","freshwater sciences;architecture;urban research","academic readiness","none",1.0],
  ["niu","Northern Illinois University","NIU","DeKalb","IL","Pu",11500,71.0,"","",3.2,"B",28000,"",null,0,"","Rolling","https://www.niu.edu/admissions","engineering;accounting;honors","academic readiness","none",1.0],
  ["georgiastate","Georgia State University","Georgia State","Atlanta","GA","Pu",37000,74.0,"990-1180","18-24",3.4,"O",28000,"EA",null,0,"Nov 15","Mar 1","https://admissions.gsu.edu","student success analytics;Atlanta;Honors College","academic readiness","none",1.0],
  ["fiu","Florida International University","FIU","Miami","FL","Pu",48000,64.0,"1110-1270","22-27",3.8,"R",23000,"",null,0,"","Mar 1","https://admissions.fiu.edu","international business;hospitality;Honors College","academic preparation","none",1.1],
];

function range(s: string): [number, number] | null {
  if (!s) return null;
  const [a, b] = s.split("-").map(Number);
  return [a, b];
}

export const COLLEGES: College[] = ROWS.map((r) => {
  const [id, name, short, city, state, control, enrollment, admitPct, sat, act, gpa, policy, coa, plans, earlyPct, legacy, early, rd, url, knownFor, values, supplements, inStateFactor] = r;
  const p = plans.split(",");
  return {
    id,
    name,
    short,
    city,
    state,
    control: control === "Pu" ? "Public" : "Private",
    enrollment,
    admitRate: admitPct / 100,
    sat: range(sat),
    act: range(act),
    gpa,
    testPolicy: policy === "R" ? "required" : policy === "B" ? "blind" : "optional",
    coa,
    plans: { ed: p.includes("ED"), ed2: p.includes("ED2"), ea: p.includes("EA"), rea: p.includes("REA") },
    earlyRate: earlyPct != null ? earlyPct / 100 : undefined,
    inStateFactor,
    considersLegacy: legacy === 1,
    deadlines: { early: early || undefined, rd },
    url,
    knownFor: knownFor.split(";"),
    values: values.split(";"),
    supplements: supplements.split(";"),
    source: "dataset",
    verified: VERIFIED[id],
  } satisfies College;
});

export const COLLEGE_BY_ID: Record<string, College> = Object.fromEntries(COLLEGES.map((c) => [c.id, c]));

export function getCollege(id: string): College | undefined {
  return COLLEGE_BY_ID[id];
}
