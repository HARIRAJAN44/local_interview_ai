import fitz
from docx import Document
from typing import Dict, List, Any
import re
import json


class ResumeParser:
    def __init__(self):
        self.skill_keywords = [
            "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
            "react", "vue", "angular", "next.js", "node.js", "express", "fastapi", "django", "flask", "spring boot",
            "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
            "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible",
            "git", "ci/cd", "jenkins", "github actions", "gitlab ci",
            "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch",
            "data analysis", "pandas", "numpy", "sql", "tableau", "power bi"
        ]

    async def parse(self, file_path: str, file_ext: str) -> Dict[str, Any]:
        if file_ext == ".pdf":
            text = self._parse_pdf(file_path)
        elif file_ext == ".docx":
            text = self._parse_docx(file_path)
        elif file_ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        else:
            raise ValueError(f"Unsupported file extension: {file_ext}")

        sections = self._extract_sections(text)
        skills = self._extract_skills(text)
        projects = self._extract_projects(text, sections)
        experience = self._extract_experience(text, sections)
        education = self._extract_education(text, sections)
        achievements = self._extract_achievements(text, sections)
        certifications = self._extract_certifications(text, sections)

        return {
            "original_text": text,
            "sections": sections,
            "skills": skills,
            "projects": projects,
            "experience": experience,
            "education": education,
            "achievements": achievements,
            "certifications": certifications,
        }

    def _parse_pdf(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    def _parse_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text

    def _extract_sections(self, text: str) -> Dict[str, str]:
        sections = {}
        current_section = "header"
        current_content = []
        
        section_patterns = [
            r"^(experience|work experience|employment|work history)",
            r"^(education|academic background|qualifications)",
            r"^(projects|personal projects|academic projects)",
            r"^(skills|technical skills|technologies|tools)",
            r"^(achievements|accomplishments|awards)",
            r"^(certifications|certificates|licenses)",
            r"^(summary|objective|profile|about)",
        ]
        
        lines = text.split("\n")
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue
            
            is_header = False
            for pattern in section_patterns:
                if re.match(pattern, line_stripped, re.IGNORECASE):
                    if current_content:
                        sections[current_section] = "\n".join(current_content).strip()
                    current_section = line_stripped.lower()
                    current_content = []
                    is_header = True
                    break
            
            if not is_header:
                current_content.append(line)
        
        if current_content:
            sections[current_section] = "\n".join(current_content).strip()
        
        return sections

    def _extract_skills(self, text: str) -> List[str]:
        text_lower = text.lower()
        found_skills = []
        for skill in self.skill_keywords:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        return list(set(found_skills))

    def _extract_projects(self, text: str, sections: Dict[str, str]) -> List[Dict[str, Any]]:
        projects = []
        project_text = sections.get("projects", "")
        
        if not project_text:
            project_section_match = re.search(r"projects?\s*\n(.*?)(?:\n\s*\n|\Z)", text, re.IGNORECASE | re.DOTALL)
            if project_section_match:
                project_text = project_section_match.group(1)
        
        project_blocks = re.split(r"\n\s*\n", project_text)
        for block in project_blocks:
            block = block.strip()
            if len(block) < 20:
                continue
            
            lines = block.split("\n")
            name = lines[0].strip() if lines else "Project"
            
            tech_match = re.search(r"(?:technologies|tech stack|tools|built with)[:\-]\s*(.+)", block, re.IGNORECASE)
            technologies = tech_match.group(1).strip() if tech_match else ""
            
            desc = "\n".join(lines[1:]).strip()
            
            projects.append({
                "name": name,
                "description": desc,
                "technologies": technologies,
            })
        
        return projects

    def _extract_experience(self, text: str, sections: Dict[str, str]) -> List[Dict[str, Any]]:
        experience = []
        exp_text = sections.get("experience", "") or sections.get("work experience", "") or sections.get("employment", "")
        
        if not exp_text:
            exp_match = re.search(r"(?:experience|work experience|employment)\s*\n(.*?)(?:\n\s*\n|\Z)", text, re.IGNORECASE | re.DOTALL)
            if exp_match:
                exp_text = exp_match.group(1)
        
        exp_blocks = re.split(r"\n\s*\n", exp_text)
        for block in exp_blocks:
            block = block.strip()
            if len(block) < 30:
                continue
            
            lines = block.split("\n")
            title_company = lines[0].strip() if lines else ""
            
            date_match = re.search(r"(\d{4}\s*[-–]\s*(?:\d{4}|present|current))", block, re.IGNORECASE)
            duration = date_match.group(1) if date_match else ""
            
            experience.append({
                "title_company": title_company,
                "duration": duration,
                "description": "\n".join(lines[1:]).strip(),
            })
        
        return experience

    def _extract_education(self, text: str, sections: Dict[str, str]) -> List[Dict[str, Any]]:
        education = []
        edu_text = sections.get("education", "") or sections.get("academic background", "") or sections.get("qualifications", "")
        
        if not edu_text:
            edu_match = re.search(r"education\s*\n(.*?)(?:\n\s*\n|\Z)", text, re.IGNORECASE | re.DOTALL)
            if edu_match:
                edu_text = edu_match.group(1)
        
        edu_blocks = re.split(r"\n\s*\n", edu_text)
        for block in edu_blocks:
            block = block.strip()
            if len(block) < 10:
                continue
            
            education.append({
                "details": block,
            })
        
        return education

    def _extract_achievements(self, text: str, sections: Dict[str, str]) -> List[Dict[str, Any]]:
        achievements = []
        ach_text = sections.get("achievements", "") or sections.get("accomplishments", "") or sections.get("awards", "")
        
        if not ach_text:
            ach_match = re.search(r"(?:achievements|accomplishments|awards)\s*\n(.*?)(?:\n\s*\n|\Z)", text, re.IGNORECASE | re.DOTALL)
            if ach_match:
                ach_text = ach_match.group(1)
        
        for line in ach_text.split("\n"):
            line = line.strip()
            if line and len(line) > 5:
                achievements.append({"description": line})
        
        return achievements

    def _extract_certifications(self, text: str, sections: Dict[str, str]) -> List[Dict[str, Any]]:
        certs = []
        cert_text = sections.get("certifications", "") or sections.get("certificates", "") or sections.get("licenses", "")
        
        if not cert_text:
            cert_match = re.search(r"(?:certifications|certificates|licenses)\s*\n(.*?)(?:\n\s*\n|\Z)", text, re.IGNORECASE | re.DOTALL)
            if cert_match:
                cert_text = cert_match.group(1)
        
        for line in cert_text.split("\n"):
            line = line.strip()
            if line and len(line) > 5:
                certs.append({"name": line})
        
        return certs

    def parse_job_description(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        
        required_skills = []
        preferred_skills = []
        for skill in self.skill_keywords:
            if skill.lower() in text_lower:
                if any(kw in text_lower for kw in ["required", "must have", "essential", "mandatory"]):
                    if skill not in required_skills:
                        required_skills.append(skill)
                else:
                    if skill not in preferred_skills:
                        preferred_skills.append(skill)
        
        responsibilities = []
        resp_matches = re.findall(r"(?:responsibilities|duties|role includes)[:\-]\s*(.+?)(?:\n\s*\n|\n[A-Z]|\Z)", text, re.IGNORECASE | re.DOTALL)
        for match in resp_matches:
            for line in match.split("\n"):
                line = line.strip("•\\-* \t")
                if line and len(line) > 10:
                    responsibilities.append(line)
        
        exp_match = re.search(r"(\d+\+?\s*years?\s*(?:of\s*)?experience)", text, re.IGNORECASE)
        experience_required = exp_match.group(1) if exp_match else ""
        
        technical_topics = []
        for skill in self.skill_keywords:
            if skill.lower() in text_lower:
                technical_topics.append(skill)
        
        return {
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "responsibilities": responsibilities,
            "experience_required": experience_required,
            "technical_topics": list(set(technical_topics)),
        }