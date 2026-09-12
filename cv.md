# Astha Kriti Raj

+91 8521679775 | asthakriti2005@gmail.com | [LinkedIn](https://www.linkedin.com/in/asthakritraj) | [GitHub](https://github.com/asthakriti)

## Summary

B.Tech Computer Science graduate (Amity University, 2026) seeking full-time fresher software engineering roles in India. Hands-on experience in Python, REST APIs, databases, and backend development. Built a multi-process job queue with SQLite concurrency control and a content-based movie recommender with Streamlit. SDET internship at Cyware covering API testing, Pytest automation, and defect analysis. Strong foundation in DSA, OOP, SQL, and Git.

## Education

- **Amity University** — B.Tech, Computer Science and Engineering, CGPA 8.6 (2022–2026)
- **Oxford Public School** — Intermediate (CBSE), 91.4% (Apr 2021 – May 2022)
- **Gems English School** — High School (ICSE), 89.8% (Apr 2019 – May 2020)

## Experience

### Software Development Engineer in Test Intern — Cyware
Dec 2025 – Feb 2026

- Performed manual API testing using Postman across multiple modules of the CTIX platform, validating request/response behaviour and HTTP status codes against API documentation.
- Wrote and executed 60+ API test cases; identified and documented 40+ defects with clear reproduction steps.
- Automated 20+ API test scenarios using Python and Pytest; maintained automation scripts as underlying APIs changed.
- Verified bug fixes by re-testing affected endpoints before release.

## Projects

### QueueCTL — Multi-Process Job Queue with Crash Recovery
Python, SQLite (WAL), Typer | 2025

- Built a multi-process job queue CLI (~900 lines, 8 modules) supporting concurrent workers, exponential-backoff retries, a Dead Letter Queue, and graceful SIGTERM/SIGINT shutdown.
- Prevented duplicate job execution across OS processes using SQLite `BEGIN IMMEDIATE` transactions with compare-and-swap; tested with 20 jobs across 6 workers (0 duplicates) and 8 processes racing a single job (exactly 1 winner).
- Added heartbeat-based crash recovery detecting a killed worker in 16 seconds (requirement: 60 seconds); fixed 9 concurrency and correctness bugs; verified by a 27-check test suite driving the real CLI.

### Movie Recommendation System
Python, Pandas, Scikit-learn, Streamlit, TMDB API | 2025

- Built a content-based recommender on 4,806 TMDB titles by fusing 5 metadata fields into a single feature vector per film.
- Reduced feature space by 86% (35,547 → 5,000 terms) via bag-of-words vectorization; precomputed 23.1M cosine similarity pairs.
- Shipped a Streamlit app returning top-5 recommendations in < 1 ms median (p95: 1.0 ms), with timeout handling, image fallbacks, and secrets managed outside source control.

## Technical Skills

- **Languages:** Python, SQL, C++
- **Backend:** FastAPI, SQLAlchemy, JWT, REST APIs
- **Databases:** PostgreSQL, Redis, SQLite
- **Automation / testing:** Pytest, REST API testing, integration testing, regression testing
- **Tools:** Docker, Git, GitHub
- **Core:** Data Structures & Algorithms, OOP, DBMS
- **AI/ML:** Scikit-learn, TensorFlow, Keras, PyTorch, Hugging Face, Pandas, NumPy

## Certifications

- Google Cloud Computing Foundations (NPTEL, IIT Kharagpur) — Top 1%, 92%
- Software Development Engineer in Test (SDET Intern) — Cyware
- Machine Learning Intern — Navodita Infotech
- Go for GOLD Contest in iAspire — Accenture
