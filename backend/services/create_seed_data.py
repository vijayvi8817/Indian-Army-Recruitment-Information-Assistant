import os
import sqlite3
import json
import pandas as pd
from datetime import datetime

# Path definitions
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")
DB_PATH = os.path.join(BASE_DIR, "database", "army_faq.db")
EXCEL_PATH = os.path.join(DATA_DIR, "army_recruitment_faq.xlsx")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

SEED_FAQS = [
    {
        "faq_id": "FAQ001",
        "question": "What is the age limit for Agniveer General Duty (GD)?",
        "alternative_questions": "Army recruitment ke liye age limit kya hai?|What is the maximum age for Agniveer GD?|Can a 22 year old apply for GD?|GD eligibility age range|अग्निवीर जीडीसाठी वयोमर्यादा काय आहे?|सेना भर्ती के लिए उम्र की सीमा क्या है?|वय मर्यादा काय आहे?",
        "answer": "The age requirement for Agniveer General Duty (GD) is 17.5 to 21 years at the time of recruitment. Candidates born between specified dates in the official notification (typically 01 Oct 2003 to 01 Apr 2007 for current cycles) are eligible.",
        "category": "Age",
        "source_name": "Official Agnipath Recruitment Notification (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 2 - Eligibility Criteria, Paragraph 3(a)",
        "page_number": "Page 4",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ002",
        "question": "What are the educational qualifications for Agniveer General Duty (GD)?",
        "alternative_questions": "10th pass criteria for army GD|What is the education requirement for GD?|Minimum marks for GD entry|Is 10th pass eligible for Army?",
        "answer": "Class 10th/Matric pass with 45% marks in aggregate and minimum 33% in each subject. For boards following grading system, min of 'D' grade (33%-40%) in individual subjects or grade with 33% equivalent is required.",
        "category": "Education",
        "source_name": "Official Agnipath Recruitment Notification (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 2 - Educational Qualification Table",
        "page_number": "Page 4",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ003",
        "question": "What is the eligibility for Agniveer Technical entry?",
        "alternative_questions": "Education requirement for Agniveer Tech|What is eligibility for Army Technical post?|Intermediate science percentage for Army Tech|10+2 PCM criteria for Army",
        "answer": "10+2/Intermediate Examination Pass in Science stream with Physics, Chemistry, Maths and English with minimum 50% marks in aggregate and minimum 40% in each subject. Alternatively, 10+2 with ITI course (1 or 2 years) in relevant tech trade.",
        "category": "Education",
        "source_name": "Official Agnipath Recruitment Notification (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 2 - Technical Entry Qualification",
        "page_number": "Page 5",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ004",
        "question": "What are the educational requirements for Agniveer Clerk / Store Keeper Technical?",
        "alternative_questions": "Clerk eligibility in Indian Army|Arts student army clerk eligible?|Percentage required for Army Clerk|10+2 marks for Store Keeper Tech",
        "answer": "10+2 / Intermediate Exam Pass in any stream (Arts, Commerce, Science) with 60% marks in aggregate and minimum 50% in each subject. Securing 50% in English and Maths/Accounts/Book Keeping in Class XII is mandatory.",
        "category": "Education",
        "source_name": "Official Agnipath Recruitment Notification (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 2 - Clerk Entry Rules",
        "page_number": "Page 5",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ005",
        "question": "What is the educational qualification for Agniveer Tradesmen (10th Pass & 8th Pass)?",
        "alternative_questions": "Tradesman entry qualification|8th pass army jobs|Is 8th pass eligible for tradesman?|Tradesman marks requirement",
        "answer": "For Tradesmen 10th Pass: Class 10th Simple Pass. No aggregate percentage required, but minimum 33% in each subject. For Tradesmen 8th Pass: Class 8th Simple Pass with min 33% in each subject.",
        "category": "Education",
        "source_name": "Official Agnipath Recruitment Notification (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 2 - Tradesmen Criteria",
        "page_number": "Page 6",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ006",
        "question": "What are the Physical Fitness Test (PFT) standards for 1.6 Km Run?",
        "alternative_questions": "Army rally running time|How much time for 1.6 km run in army rally?|Group 1 and Group 2 running marks|Army physical run criteria|१.६ किमी धावण्यासाठी वेळ आणि गुण|1.6 किमी दौड़ का समय और अंक",
        "answer": "Group I: 1.6 Km run completed within 5 Mins 30 Secs awards 60 Marks. Group II: 1.6 Km run completed between 5 Mins 31 Secs to 5 Mins 45 Secs awards 48 Marks.",
        "category": "Physical Fitness Test",
        "source_name": "Rally Physical Fitness Manual (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Appendix A - PFT Marking Table",
        "page_number": "Page 8",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ007",
        "question": "How many pull-ups are required and what are the marks awarded?",
        "alternative_questions": "Beam pull ups marks in Army rally|How many beam pull ups for full marks?|Minimum pull ups required to pass army physical",
        "answer": "10 Pull-ups = 40 Marks, 9 Pull-ups = 33 Marks, 8 Pull-ups = 27 Marks, 7 Pull-ups = 21 Marks, 6 Pull-ups = 16 Marks. Less than 6 pull-ups results in disqualification.",
        "category": "Physical Fitness Test",
        "source_name": "Rally Physical Fitness Manual (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Appendix A - Beam Marking Matrix",
        "page_number": "Page 8",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ008",
        "question": "What are the qualifying physical tests besides running and pull-ups?",
        "alternative_questions": "Is 9 feet ditch jump compulsory?|Zig-zag balance marks|Other physical tests in rally",
        "answer": "9 Feet Ditch Jump and Zig-Zag Balance are mandatory qualifying tests. No numerical marks are awarded for these two events, but qualifying in both is compulsory.",
        "category": "Physical Fitness Test",
        "source_name": "Rally Physical Fitness Manual (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Appendix A - Qualifying Events",
        "page_number": "Page 9",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ009",
        "question": "What documents are required to be brought to the Recruitment Rally site?",
        "alternative_questions": "Which documents do I need for recruitment rally?|Documents list for Army rally|Rally site certificate requirements|भरती रॅलीसाठी कोणती कागदपत्रे आवश्यक आहेत?|भर्ती रैली के लिए कौन से दस्तावेज चाहिए?",
        "answer": "1. Admit Card printed on laser printer. 2. 20 copies of passport size photos. 3. Education Certificates & Marksheets. 4. Domicile/Nativity Certificate. 5. Caste Certificate. 6. Religion Certificate. 7. Character Certificate & Unmarried Certificate (from Sarpanch/Police). 8. Relationship/NCC/Sports Certificate (if applicable). 9. Aadhaar & PAN Card.",
        "category": "Documents",
        "source_name": "Recruitment Rally Instructions (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 4 - Mandatory Documents Checklist",
        "page_number": "Page 11",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ010",
        "question": "What is the policy regarding permanent body tattoos for Indian Army recruitment?",
        "alternative_questions": "Are body tattoos allowed in Indian Army?|Tattoo policy for recruitment|Tribal tattoo relaxation army|Can I apply if I have a tattoo on my arm?|टॅटू काढण्यास परवानगी आहे का?|क्या टैटू की अनुमति है?",
        "answer": "Permanent body tattoos are permitted ONLY on inner face of forearms (from inside of elbow to wrist) and reverse side of palm/back side of hand. Tattoos on any other body part are NOT allowed. Candidates from tribal communities with tribal body marks/tattoos are allowed relaxation as per custom guidelines.",
        "category": "Medical Requirements",
        "source_name": "Medical Standards Guidelines (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Medical Code Part III - Tattoo Standards",
        "page_number": "Page 14",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ011",
        "question": "What is the Common Entrance Examination (CEE) format and pattern?",
        "alternative_questions": "Is army exam online or offline?|CEE syllabus and exam pattern|Is there negative marking in Army exam?",
        "answer": "The Common Entrance Examination (CEE) is an Online Computer Based Test (CBT). It consists of Multiple Choice Questions covering General Knowledge, General Science, Mathematics, and Logical Reasoning. Negative marking of 0.5 marks per wrong answer is applicable for 2-mark questions.",
        "category": "Written Examination",
        "source_name": "CEE Exam Guidelines (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 5 - CEE Examination Rules",
        "page_number": "Page 7",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ012",
        "question": "What is the service tenure under the Agnipath Scheme?",
        "alternative_questions": "How many years is Agniveer service?|Agnipath scheme tenure|What happens after 4 years in Agniveer?",
        "answer": "Agniveers are enrolled in the Indian Army for a service tenure of 4 years. Upon completion of 4 years, based on organizational requirements and merit, up to 25% of Agniveers will be selected for enrollment in regular cadre of Indian Army.",
        "category": "Recruitment Process",
        "source_name": "Agnipath Scheme Official Gazette (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Notification No. 01/2022 - Service Conditions",
        "page_number": "Page 2",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ013",
        "question": "What is the Seva Nidhi financial package given to Agniveers?",
        "alternative_questions": "How much money do Agniveers get after 4 years?|Seva Nidhi package amount|Is Seva Nidhi tax free?",
        "answer": "Upon completion of 4 years service, Agniveers receive a one-time Seva Nidhi package of approximately Rs 10.04 Lakh (comprising candidate's 30% monthly contribution + matching government contribution plus accumulated interest). The Seva Nidhi package is completely exempt from Income Tax.",
        "category": "Recruitment Process",
        "source_name": "Agnipath Scheme Official Gazette (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Notification No. 01/2022 - Financial Benefits",
        "page_number": "Page 3",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ014",
        "question": "What are the bonus marks for NCC 'C' Certificate holders?",
        "alternative_questions": "NCC C certificate marks in Army exam|Do NCC C certificate holders get exam exemption?|Bonus marks for NCC cadets",
        "answer": "NCC 'A' Certificate: 5 bonus marks. NCC 'B' Certificate: 10 bonus marks. NCC 'C' Certificate: 20 bonus marks for Agniveer GD/Tradesmen and 15 bonus marks for Agniveer Tech/Clerk in CEE.",
        "category": "Selection Process",
        "source_name": "Bonus Marks Incentive Policy (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 3 - Incentive & Bonus Marks Table",
        "page_number": "Page 10",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ015",
        "question": "What is the chest measurement and expansion requirement for army recruitment?",
        "alternative_questions": "Minimum chest size for Army recruitment|Chest expansion cm requirement|Physical standard chest measurement",
        "answer": "Minimum unexpanded chest requirement is 77 cm for most regions (varies slightly by region/trade) with a mandatory minimum expansion of 5 cm upon breathing in.",
        "category": "Physical Standards",
        "source_name": "Physical Measurement Standards Code (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 2 - Physical Standards Table B",
        "page_number": "Page 6",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ016",
        "question": "Are married candidates eligible to apply for Agniveer recruitment?",
        "alternative_questions": "Can married person join Agniveer?|Marital status condition army recruitment|Unmarried certificate mandatory?",
        "answer": "No. Candidates applying for Agniveer recruitment must be unmarried at the time of application/rally and must undertake not to marry during their 4-year tenure. An Unmarried Certificate issued by Sarpanch/Village Head or Ward Councillor is mandatory.",
        "category": "Eligibility",
        "source_name": "Eligibility Norms & Terms (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 1 - General Conditions Clause 4",
        "page_number": "Page 2",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ017",
        "question": "How to register and apply online for Indian Army recruitment?",
        "alternative_questions": "Official website to apply for Army|Where to register for Agniveer?|Join Indian Army website link|Online application process step by step|ऑनलाइन अर्ज कसा करावा|ऑनलाइन आवेदन कैसे करें",
        "answer": "Candidates must register online exclusively at the official website www.joinindianarmy.nic.in. Click on 'Agnipath' tab -> 'User Registration' -> complete Aadhaar/Digilocker verification, fill personal and education details, and submit application fee.",
        "category": "Application Process",
        "source_name": "Online Application User Manual (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "User Registration Guide Section 1",
        "page_number": "Page 1",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ018",
        "question": "What is the application fee for online CEE registration?",
        "alternative_questions": "How much is army exam fee?|Application fee amount for Agniveer exam|Payment mode for army CEE fee",
        "answer": "The online examination fee is Rs 250/- (Rupees Two Hundred Fifty only) plus applicable bank service charges per candidate, payable online via UPI, Net Banking, or Credit/Debit cards.",
        "category": "Application Process",
        "source_name": "Online Application User Manual (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 2 - Fee Payment Rules",
        "page_number": "Page 3",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ019",
        "question": "What is the selection process sequence for Agniveer recruitment?",
        "alternative_questions": "What are the stages of Army selection?|First stage in Army recruitment|Selection procedure steps",
        "answer": "Stage I: Online Computer Based Common Entrance Examination (CEE). Stage II: Recruitment Rally (Physical Fitness Test & Physical Measurement Test at rally site). Stage III: Medical Examination. Stage IV: Final Merit List based on CEE and PFT marks.",
        "category": "Selection Process",
        "source_name": "Recruitment Framework Document (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 1 - Phase-wise Recruitment Flow",
        "page_number": "Page 2",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ020",
        "question": "What are the bonus marks for ITI / Technical Diploma holders in Agniveer Technical?",
        "alternative_questions": "Does ITI diploma get bonus marks in army tech?|Polytechnic diploma bonus marks|Bonus marks for ITI 2 year course",
        "answer": "1-year course from ITI: 20 marks bonus. 2-year course from ITI: 30 marks bonus. 3-year Diploma holder: 50 marks bonus for Agniveer Technical category.",
        "category": "Selection Process",
        "source_name": "Bonus Marks Incentive Policy (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 3 - ITI Technical Incentive Table",
        "page_number": "Page 10",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ021",
        "question": "What is the visual acuity requirement in the medical exam?",
        "alternative_questions": "Eye sight standard for Army recruitment|Is 6/6 vision required for Army?|Spectacles allowed in Army medical?",
        "answer": "Uncorrected visual acuity must be 6/6 in the better eye and 6/9 in the worse eye for general combat entries. Colour perception standard must be CP-III. Candidates must not suffer from night blindness or colour blindness.",
        "category": "Medical Requirements",
        "source_name": "Medical Standards Guidelines (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Medical Standards Code - Section 4 Vision",
        "page_number": "Page 16",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ022",
        "question": "Can female candidates apply for Agniveer recruitment?",
        "alternative_questions": "Women recruitment in Indian Army|Agniveer female entry eligibility|Women Military Police age and height criteria",
        "answer": "Yes. Female candidates can apply for Agniveer General Duty in the Corps of Military Police (CMP). Age limit is 17.5 to 21 years, height requirement is minimum 162 cm, and education criteria is Class 10th pass with 45% aggregate.",
        "category": "Eligibility",
        "source_name": "Agniveer Women Military Police Notification (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Notification - CMP Women Entry Section 2",
        "page_number": "Page 3",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ023",
        "question": "How to download the Admit Card for CEE and Rally?",
        "alternative_questions": "Where can I download my Army admit card?|Admit card download issue|When is admit card released for exam?",
        "answer": "Log in to candidate profile on www.joinindianarmy.nic.in using Username (Email ID) and Password -> Click on 'Admit Card' tab -> Click 'Download'. Admit Cards are released 10 to 15 days prior to scheduled exam/rally.",
        "category": "Admit Card",
        "source_name": "Online Application User Manual (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Candidate Portal Guide - Section 6",
        "page_number": "Page 8",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ024",
        "question": "Is Aadhaar verification mandatory during registration?",
        "alternative_questions": "Can I register without Aadhaar card?|Digilocker Aadhaar linking army application|Identity document for army portal",
        "answer": "Yes. Aadhaar Card linking and Digilocker verification are mandatory during online profile creation on joinindianarmy.nic.in. The candidate's name and date of birth in Aadhaar must strictly match Class 10th certificate.",
        "category": "Application Process",
        "source_name": "Online Registration Guidelines (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Identity Verification Manual Clause 2",
        "page_number": "Page 2",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ025",
        "question": "What is the insurance cover provided to Agniveers during service?",
        "alternative_questions": "Is insurance provided to Agniveers?|Life insurance cover amount army|Accidental insurance during 4 year service",
        "answer": "Agniveers are provided a non-contributory Life Insurance Cover of Rs 48 Lakhs for the duration of their service tenure of 4 years.",
        "category": "Recruitment Process",
        "source_name": "Agnipath Scheme Official Gazette (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Notification No. 01/2022 - Insurance Provisions",
        "page_number": "Page 4",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ026",
        "question": "What happens if a candidate creates multiple profile registrations on the portal?",
        "alternative_questions": "Can I create 2 accounts on Join Indian Army website?|Multiple application penalty army|Forgot password creating new account",
        "answer": "Creating multiple user profiles with different emails/Aadhaar details is strictly prohibited. Duplicate profiles will be permanently blocked, candidature cancelled, and candidate may be debarred from future recruitment.",
        "category": "Application Process",
        "source_name": "Portal Terms of Service (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 9 - Duplicate Profile Warning",
        "page_number": "Page 12",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ027",
        "question": "What are the bonus marks for Outstanding Sportspersons?",
        "alternative_questions": "Sports certificate bonus marks in Army|National level sports certificate marks|State player army recruitment relaxation",
        "answer": "International Representation: 20 marks bonus. Senior/Junior National level (with medal/position): 15 marks. University/Inter-State level: 10 marks. District/School National level: 5 marks bonus in CEE.",
        "category": "Selection Process",
        "source_name": "Sports Policy Guidelines (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Sports Incentive Annexure II",
        "page_number": "Page 15",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ028",
        "question": "What is the procedure if a candidate is declared temporarily medically unfit at rally?",
        "alternative_questions": "Can I re-appeal medical rejection?|Temporary unfit army medical time limit|Military hospital appeal medical review",
        "answer": "Candidates declared Temporarily Unfit (TR) are given a referral slip to report to designated Military Hospital (MH) / Command Hospital within 14 days for Specialist Review. Final fitness decision is made by Army Medical Board.",
        "category": "Medical Requirements",
        "source_name": "Medical Standards Guidelines (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Section 7 - Appeal Medical Board Rules",
        "page_number": "Page 18",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ029",
        "question": "How are vacancies allocated for different recruitment rallies and ZROs?",
        "alternative_questions": "How many vacancies in next army rally?|State wise army vacancy count|ZRO rally vacancy details",
        "answer": "Vacancies for recruitment rallies are determined dynamically by Army Headquarters based on operational requirements, retired personnel strength, and Recruitable Male Population (RMP) ratio of each state/ZRO.",
        "category": "Vacancies",
        "source_name": "Recruitment Policy Document (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Policy Manual Chapter 4 - Vacancy Distribution",
        "page_number": "Page 22",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    },
    {
        "faq_id": "FAQ030",
        "question": "Where can candidates get official helpline support for recruitment issues?",
        "alternative_questions": "Indian Army recruitment helpline number|ZRO phone number|Official support email army recruitment",
        "answer": "Candidates can contact their respective Zonal Recruiting Office (ZRO) or Army Recruiting Office (ARO) helpline numbers listed under 'Contact Us' on www.joinindianarmy.nic.in or send feedback/queries through candidate login feedback system.",
        "category": "General Recruitment Queries",
        "source_name": "Official Recruitment Portal Contact Info (DEMO DATA)",
        "source_url": "https://www.joinindianarmy.nic.in",
        "source_reference": "Contact Directory Section",
        "page_number": "Page 1",
        "verified_date": "2026-01-15",
        "status": "VERIFIED",
        "confidence": 1.0,
        "last_updated": "2026-01-15 10:00:00",
        "is_demo": 1
    }
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS faqs (
        faq_id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        alternative_questions TEXT,
        answer TEXT NOT NULL,
        category TEXT NOT NULL,
        source_name TEXT NOT NULL,
        source_url TEXT,
        source_reference TEXT,
        page_number TEXT,
        verified_date TEXT,
        status TEXT DEFAULT 'VERIFIED',
        confidence REAL DEFAULT 1.0,
        last_updated TEXT,
        is_demo INTEGER DEFAULT 1
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verification_requests (
        request_id TEXT PRIMARY KEY,
        user_question TEXT NOT NULL,
        category TEXT,
        timestamp TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        retrieved_context TEXT,
        reason_for_escalation TEXT,
        verified_answer TEXT,
        source_name TEXT,
        source_url TEXT,
        source_reference TEXT,
        page_number TEXT,
        verification_notes TEXT,
        verifier_name TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        target_id TEXT,
        previous_value TEXT,
        new_value TEXT,
        user TEXT,
        reason TEXT
    )
    """)

    # Seed FAQs if empty
    cursor.execute("SELECT COUNT(*) FROM faqs")
    count = cursor.fetchone()[0]
    if count == 0:
        print("Seeding initial FAQs into SQLite database...")
        for faq in SEED_FAQS:
            cursor.execute("""
                INSERT INTO faqs (
                    faq_id, question, alternative_questions, answer, category,
                    source_name, source_url, source_reference, page_number,
                    verified_date, status, confidence, last_updated, is_demo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                faq["faq_id"], faq["question"], faq["alternative_questions"], faq["answer"], faq["category"],
                faq["source_name"], faq["source_url"], faq["source_reference"], faq["page_number"],
                faq["verified_date"], faq["status"], faq["confidence"], faq["last_updated"], faq["is_demo"]
            ))

        # Initial audit log entry
        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "INITIAL_SEED",
            "SYSTEM",
            None,
            f"Seeded {len(SEED_FAQS)} initial verified FAQ records",
            "System Admin",
            "System Initialization"
        ))

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def export_to_excel():
    df = pd.DataFrame(SEED_FAQS)
    df.to_excel(EXCEL_PATH, index=False)
    print(f"Excel dataset created at {EXCEL_PATH}")

if __name__ == "__main__":
    init_db()
    export_to_excel()
