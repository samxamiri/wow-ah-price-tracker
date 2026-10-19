# Agile process

This project is run like a small Scrum team of one: work is written as **user stories**, grouped into **1-week sprints**, and tracked on a **GitHub Projects** board.

## Setting up the board

1. On GitHub, go to your profile → **Projects** → **New project** → **Board**.
2. Use the columns **Backlog → Sprint → In progress → In review → Done**.
3. Create each story below as an issue (the repo has a "User story" issue template) and add it to the board.
4. Create an **Iteration** field (1 week) and assign stories to sprints.
5. For each story: create a branch (`feature/12-price-chart`), open a PR that says `Closes #12`, let CI pass, then merge. The issue closes itself.

## Definition of Done

A story is done when:
- the acceptance criteria are met
- there are tests for the new logic, and CI is green
- it was reviewed in a pull request and merged to `main`
- the README is updated if setup or usage changed

## Product backlog

| # | User story | Points | Sprint |
|---|---|---|---|
| 1 | As a developer, I want a database schema for items and hourly prices, so that price history can be stored. | 2 | 1 |
| 2 | As a developer, I want a worker that converts auction listings into one summary per item, so that the database stays small. | 3 | 1 |
| 3 | As a player, I want to search items by name, so that I can find what I'm crafting with. | 3 | 1 |
| 4 | As a player, I want to see an item's price history on a chart, so that I can spot trends. | 5 | 2 |
| 5 | As a player, I want a buy/sell signal, so that I don't have to interpret the chart myself. | 2 | 2 |
| 6 | As a player, I want to see today's biggest gainers and drops, so that I can find opportunities. | 3 | 2 |
| 7 | As a developer, I want each service in a Docker container, so that it runs the same everywhere. | 3 | 3 |
| 8 | As a developer, I want CI to test every pull request, so that broken code never reaches `main`. | 3 | 3 |
| 9 | As a developer, I want Kubernetes manifests, so that the app can run with health checks and an hourly job. | 5 | 4 |
| 10 | As a developer, I want merges to `main` to deploy to AWS automatically, so that releases take no manual steps. | 5 | 5 |
| 11 | As a player, I want real Blizzard data instead of mock data, so that the prices are accurate. | 3 | 5 |
| 12 | As a player, I want a watchlist of my favourite items. | 5 | Backlog |
| 13 | As a player, I want to switch between US and EU regions. | 5 | Backlog |

## Sprint goals

| Sprint | Goal |
|---|---|
| 1 | Data flows from the worker into the database and can be searched |
| 2 | A player can use the website end to end with mock data |
| 3 | Everything runs in Docker, and CI guards `main` |
| 4 | The app runs on a local Kubernetes cluster |
| 5 | Live on AWS with real Blizzard data, deployed by CD |

## Ceremonies (solo version)

- **Sprint planning (Monday, 15 min):** pick stories from the backlog that fit the week.
- **Daily stand-up (2 min, written):** a comment on the board answering *what I did, what's next, what's blocking me*.
- **Sprint review (Sunday):** demo the app to yourself or a friend; record a short clip for your portfolio.
- **Retrospective:** write 3 bullets in the sprint's issue: *keep doing / stop doing / try next*.
