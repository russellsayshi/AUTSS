# AUTSS
Automated UT Schedule Scraper. Just some Node.js fun w/ another UT student designed to scrape class schedules and help plan double/triple majors.

#Instructions for adding to session.info
Go to `https://registrar.utexas.edu/schedules and click on the session` (e.g. `Fall 2018`) that you want to search. Log in if you haven't already. Then, click on `Find Courses Now >`. Once you have done this, the URL bar should contain something like `https://utdirect.utexas.edu/apps/registrar/course_schedule/xxxxxx/`. `xxxxxx` may be something like `20189`. Paste that number into the `ccyys` line of session.info. Then, check your cookies and figure out the value of `utlogin-prod`. Put that cookie's content into the line that says `utlogin-prod` in session.info.