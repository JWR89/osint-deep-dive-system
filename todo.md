# Project TODO

- [x] Dark theme with elegant, sophisticated color palette
- [x] Google Fonts integration (Inter for UI, serif for headings)
- [x] Database schema for investigations, findings, and report categories
- [x] Backend OSINT engine using LLM to aggregate and cross-reference public data
- [x] Input form to enter subject name + known details (age, location, email, phone, username)
- [x] AI-powered investigation across social media (Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube)
- [x] Username search across 400+ platforms (Reddit, GitHub, forums, niche sites)
- [x] Public records lookup (address history, phone numbers, relatives, associates)
- [x] Arrest records and criminal history search
- [x] Dating site presence detection
- [x] Structured report dashboard with 6 categories: Identity, Social Media, Public Records, Criminal, Dating, Professional
- [x] Full source citations with every finding
- [x] Real-time progress indicator showing active data source queries
- [x] PDF export of full report
- [x] Investigation history (save, revisit, compare past reports)
- [x] DashboardLayout with sidebar navigation
- [x] Elegant, polished UI with refined typography and meticulous spacing
- [x] Generate true PDF file for exports (not HTML)
- [x] Add report comparison functionality for past investigations
- [x] Add image upload field to the New Investigation form
- [x] Store uploaded image via S3 storage
- [x] Include reverse image search in the OSINT engine investigation flow
- [x] Display uploaded photo in the report dashboard
- [x] Threat/Risk Score (1-100) computed from findings, displayed at top of report
- [x] Relationship Mapping / Link Analysis visual graph (associates, employers, addresses, accounts)
- [x] Timeline View showing chronological events (job changes, moves, social activity, arrests)
- [x] Email Breach Check (HaveIBeenPwned-style breach detection)
- [x] Dark Web Mention Scan (paste sites, dark web mentions of email/username/phone)
- [x] Geolocation Intelligence map view (addresses, check-ins, geotagged posts)
- [x] Alert/Monitoring Mode (ongoing monitoring with notifications for new findings)
- [x] Confidence Scoring Improvements (corroboration weighting across sources)
- [x] Bulk Investigation (CSV upload for batch investigations)
- [x] Report Annotations (user notes, tags, highlights on findings)
- [x] Add prominent PDF export button to the report page with download functionality
- [x] Add diagonal CONFIDENTIAL watermark to every page of the exported PDF
- [x] Passcode gate to access the site (like CODEX)
- [x] Pattern of Life Analysis (behavioral profile, routines, activity windows)
- [x] Financial Footprint (business registrations, property, liens, judgments, UCC filings)
- [x] Vehicle & Asset Intelligence (vehicle registrations, property deeds, boat/aircraft)
- [x] Network Analysis 2nd & 3rd Degree (associates of associates, hidden networks)
- [x] Digital Fingerprinting (email headers, IP geolocation, device fingerprints, stylometry)
- [x] Alias & Identity Resolution (cross-reference to find alternate identities/sock puppets)
- [x] Communication Pattern Analysis (interaction heat map, platform usage patterns)
- [x] Threat Assessment Matrix (physical, financial, reputational, flight risk, deception vectors)
- [x] Source Reliability Rating (A1-F6 intelligence agency scale)
- [x] Executive Summary (one-page intelligence briefing with top 5-10 critical findings)
- [x] Indicators of Deception (conflicting data, timeline gaps, inconsistencies)
- [x] Media & Sentiment Analysis (news mentions, public perception, controversies)
- [x] Domain & Infrastructure OSINT (websites owned, WHOIS, SSL certs, hosting)
- [x] Court Document Deep Dive (civil cases, restraining orders, lawsuits filed BY subject)
- [x] Professional Verification (license, education, military, certifications)

## Phase 2: Real API Integrations & Advanced ML Analysis

### Intelligence Depth - Real API Integrations
- [x] Pipl API integration (people search, email lookup, phone lookup)
- [x] Spokeo API integration (background checks, address history, relatives)
- [x] WHOIS API integration (domain registration, ownership, history)
- [x] News API integration (news mentions, sentiment analysis, controversies)
- [x] HaveIBeenPwned API integration (email breach history with breach details)
- [x] Phone number lookup API (carrier info, line type, location)
- [x] Social media scraping (Twitter/X, Instagram, TikTok posts, followers, engagement)
- [x] Real data aggregation layer (deduplicate, cross-reference, enrich findings)

### Advanced Analysis - ML & Pattern Detection
- [x] ML pattern detection engine (find connections across multiple investigations)
- [x] Automated risk scoring based on historical data and patterns
- [x] Predictive indicators (likelihood of future activity, behavioral prediction)
- [x] Cross-subject comparison tool (find connections between two subjects)
- [x] Anomaly detection (unusual activity patterns, red flags)
- [x] Relationship strength scoring (how connected are two subjects)
- [x] Temporal analysis (when did connections form, activity trends over time)
- [x] New "Insights" tab in report showing ML-derived patterns and predictions


## Phase 3: Advanced Psychological & Behavioral Analysis (NEW)

- [x] Psychological Profile Generator (analyzes social media posts for personality traits, mental state, behavioral patterns)
- [x] Sentiment Analysis of posts (positive, negative, neutral, aggressive, depressive indicators)
- [x] Personality Trait Detection (Big Five: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
- [x] Behavioral Pattern Analysis (posting frequency, response times, interaction style, aggression levels)
- [x] Psychological Risk Indicators (depression, anxiety, suicidal ideation, violence indicators)
- [x] Linguistic Analysis (writing style, vocabulary, grammar patterns, unique phrases)
- [x] Emotional State Timeline (track emotional changes over time from posts)
- [x] Psychological Profile Report Tab (new dashboard tab with findings)


## Phase 4: Social Media Scraping & Real Data Integration

- [x] Puppeteer-based web scraper module (X, Reddit, dating sites, public profiles)
- [x] X/Twitter scraper (search username, extract posts, followers, engagement)
- [x] Reddit scraper (search username, extract posts, comments, subreddits)
- [x] Dating site scrapers (Match, Bumble, Hinge, OkCupid, Tinder - public profiles)
- [x] Generic public profile scraper (LinkedIn, GitHub, personal websites)
- [x] Facebook Graph API integration (posts, profile info, friends list)
- [x] Instagram Graph API integration (posts, followers, engagement, bio)
- [x] Post storage and deduplication in database
- [x] Scraping progress tracking and real-time UI updates
- [x] Rate limiting and anti-detection (rotate user agents, delays)
- [x] Error handling and retry logic for failed scrapes

## Phase 5: Psychological Profiling Integration

- [x] Integrate psychological profile module into investigation engine
- [x] Run psychological analysis on all scraped social media posts
- [x] Extract personality traits from complete post history
- [x] Identify communication preferences and social tendencies
- [x] Detect stress triggers and emotional vulnerabilities
- [x] Create "Psychological Profile" dashboard tab
- [x] Display Big Five traits with visual breakdown
- [x] Show risk indicators (depression, violence, paranoia, etc.)
- [x] Display emotional timeline (sentiment over time)
- [x] Show concern flags and red alerts
- [x] Include psychological profile in PDF export
