# Gitlab-reporter

An interface for Gitlab:

- Easily report hours to the projects you participate.
- Show a calendar with issues, todos and milestones.
- Report when the work day starts and end, and your resting periods.

## Working hours

According to the Spanish job normative, workers must clock the start and end of
their days. If a Gitlab server is used as a project management system,
gitlab-reporter may assist in this regard.

- When an employee starts a work session, a message is sent to an email. The
  subject is "DAY START_TIME-?"
- When an employee stops a work session, a message is sent to an email. The
  subject is "DAY ?-STOP_TIME"
- The employee can report work sessions manually. The subject is "DAY
  START-STOP,START-STOP,START-STOP*"

Emails are sent from the employee's email address to a company controlled
clocking@email.com. The employee keeps a copy of the email (in the "Sent"
directory") and the company has the original email. Emails are usually
digitally signed by the email server, and then they cannot be forged.

## Build Setup

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:8080
yarn serve

# build for production with minification
yarn build

# build for production and deploy on Github Pages
yarn deploy
```
