# Onboarding test

A task sheet and consent form for recording how a developer who is not on this project gets on with UCompute, without the founder's help.

**Status: shelved, and it gates nothing.** The owner withdrew the cohort work on 2026-11-06 (HO-016, HO-017): user counts do not hold up a release. This stays only so that anyone who does try UCompute can be recorded the same way. Results are information. Nobody has been invited, nothing has been distributed, and this file gives no one access to anything.

## Before inviting anyone

These are the Access and release rules as they stand, not rules of this test. They apply until engineering records a change.

| Condition | Who | State on 2026-11-06 |
|---|---|---|
| The owner's decision is recorded by engineering. It reached this repository as Program Control's relay, which is not an approval by itself | Engineering | Being recorded |
| Security route tested end to end, with a named responder | Owner, then engineering | Open |
| An approved artifact for each platform offered: promotion record, and the owner's written approval of that SHA-256 and cohort | Engineering, then owner | Open. 0.1.1 predates runtime fixes, and engineering plans candidate 3 |
| Access: each participant admitted to the Access policy by the owner | Owner | Open |
| Release requirements: live Python and TypeScript suites on each offered platform, typed errors and cancellation, no critical or high issue in the offered scope, the owner approves external distribution | Engineering, then owner | Open |
| Consent text below reviewed by the owner | Owner | Open |

Part B also needs the versioned SDKs, which engineering is building.

## Cohort

Any number of developers. The notes below keep results comparable.

**Eligible:**
- writes code regularly and is comfortable in a terminal;
- has their own computer on an offered platform, and can give it a clean user account;
- can set aside 60 minutes, plus their own time for Part E;
- agrees to the consent below.

**Not eligible:**
- anyone who has worked on UCompute, or seen its repositories, private pages or this file's task answers;
- anyone relying on the founder's help during the test, or anyone the founder would naturally help;
- anyone paid for a result. Paying for time, whatever the outcome, is the owner's call.

**Spread** (preferred, not a quota):

| Dimension | Aim for |
|---|---|
| Operating system | macOS on Apple Silicon and Linux x86_64 (CPU), the two platforms in engineering's plan. Until Windows returns, "different operating systems" means these two |
| Hardware | One 8 GB machine, one with 16 GB or more, one that is not an Apple M2 |
| Experience | One new to running models locally, one who has used a local model tool, one who ships LLM APIs at work |

A machine outside the tested set is a finding, not a failure, and it qualifies nothing. Only engineering's evidence changes a platform's status.

Recruiting is the owner's (engineering's plan, task 8). Growth may propose candidates through its hand-off; a proposal is a request.

## How a session runs

Each participant works alone, in one sitting, on a clean user account. **The founder is not present and cannot be contacted.** Choose one mode per person, and record which:

- **Self-timed:** the participant keeps the time sheet and sends it back.
- **Observed:** a person who is not the founder watches a shared screen, with consent, and follows the observer rules.

### Observer rules

Say only this at the start: "Please use whatever you'd normally use. Say what you're thinking if you can. I can't help during the test."

If asked for help, say only: "I can't answer that during the test. What would you do if I weren't here?"

Any hint, link, command or explanation counts as assistance. Note it, and mark that part Assisted. Don't fix anything on their machine.

Stop a part at the participant's request, or at its time limit.

## Task sheet (given to the participant)

> You've been invited to try UCompute, which runs AI models on your own computer. Please do the parts below in order, using only the invitation and what you find from it. Write down the time at each mark. It's fine to stop at any point. If you get stuck, we want to know that, so please don't ask anyone for help. Never paste private text into a prompt for this test.
>
> **Part A. Install it and get an answer.**
> Start the clock. Install UCompute on this computer. Note the time when it's running. Then ask it a question and get an answer from a model on this computer. Note the time.
>
> **Part B. Use it from your own code.**
> Start the clock. In a language you like, Python or TypeScript, write a small program that gets a streamed answer from a model on this computer, using UCompute's SDK. Note the time. Then make your program stop an answer partway, and make it handle a request that UCompute refuses. Note the time.
>
> **Part C. Connect a second computer.** *(Only if the build offered includes it, and you have a second computer of your own.)*
> Start the clock. Run a request on your second computer from the first. Note the time.
>
> **Part D. Five questions.** Answer in your own words, from what you've read:
> 1. Will this run on your hardware? How do you know?
> 2. When you ask a question, where does your prompt go? Does anything leave your computer?
> 3. Is this finished, supported software? What isn't verified yet?
> 4. How would you remove it completely?
> 5. Could you use existing OpenAI code with it? What would you change, and what might not work?
>
> **Part E. Afterwards, in your own time, if you'd like.**
> Build something small you'd actually use on UCompute's SDK, and keep it in your own repository. It should stop an answer partway, handle a refusal, and run on this computer by default.
>
> Last: what was the most confusing moment? What nearly made you give up?

## Clock and limits

| Part | Measure | Starts | Stops | Limit |
|---|---|---|---|---|
| A, install | T1 | The invitation is opened | UCompute is running | Part A, 15 min in total |
| A, answer | T2 | UCompute is running | A real model's answer on this computer | Part A, 15 min in total |
| B | T4 | Part B begins | First real streamed result | 30 min |
| C | T3 | Part C begins | A request reports it ran on the other computer | 30 min, when offered |
| D | T5 | Part D begins | Five answers written | None |

Record with each session: operating system, chip, memory, free disk, download speed at the start (the spec requires recorded bandwidth), the build's version and SHA-256, the site's commit, and the mode.

## Consent (given to the participant, before anything else)

> **What this is.** A test of whether UCompute's install and documentation work without help. We are testing the product, not you.
>
> **What we record.** Your times, which steps worked, where you got stuck, the errors you saw, your answers to the five questions, and your computer's type (operating system, chip, memory). If you agree to an observed session, someone watches your shared screen. We don't record video unless you separately say yes.
>
> **What we never record.** Your prompts or the answers you get, your credentials, or your files. Please don't send them to us. If they show up in a screenshot or log, tell us and we'll remove them.
>
> **What this is about.** This is pre-release software, not signed or notarized where the release notes say so. It may fail, and it is installed on your own computer at your own choice. It doesn't send your prompts anywhere unless you pair another computer and choose to. You can remove it with the steps in the guide.
>
> **How results are used.** We keep a summary under a code like P3, without your name, and may use it in release records. We won't name you or show your screen publicly without asking you again. Your application in Part E stays yours.
>
> **Your choice.** You can stop at any time, for any reason, and ask us to delete your summary.
>
> Name, date and "I agree": ____________  Observed session? Yes / No

The owner keeps signed consents and any name-to-code list, outside every repository.

## Scoring

Each part gets one result:

| Result | Meaning |
|---|---|
| Unaided | Done within the limit with no assistance |
| Late | Done with no assistance, over the limit |
| Assisted | Done with any assistance |
| Failed | Stopped, or not done |
| Not offered | The build doesn't include it |

Each problem gets one severity: **S1** stopped them; **S2** cost more than five minutes, or needed a guess; **S3** a smaller confusion. Record where it happened (page, section, command) and the error text, never the prompt.

The five questions are scored against the published pages: correct, partly, wrong.

**For comparison only.** These targets come from the spec and U-04. They are not gates, and engineering owns the wording:

| Target | Figure | Source |
|---|---|---|
| Private alpha | At least five consenting testers, and at least 4 of 5 reach a first answer through the interface alone on a clean account within 15 minutes, with a pinned licensed model of 1 GB or less at recorded bandwidth | Spec, private alpha |
| U-04 | Three independent developers; at least 2 of 3 reach a real streamed result unaided within 30 minutes; at least two separately maintained applications, collectively using the versioned Python and TypeScript SDKs; every application demonstrates cancellation, typed refusal and default-local execution; run and issue records kept with consent and without private prompts | Requirement U-04 |
| Comprehension | At least 4 of 5 participants answer all five questions correctly or partly, with no wrong answer about privacy | DevEx target, ours to revise |

Only unaided results count. Report every result, including failures.

## Afterwards

1. Keep a summary per participant in `docs/evidence/`: code, machine type, mode, build, site commit, times, results, issues, answers. No names, prompts, credentials or screenshots.
2. Fix S1 problems in the guide before the next session, and record the commit. A session is scored against the page it used. A problem in the product goes to engineering with its error text.
3. Update the baseline in `DEVEX.md`. Only these sessions count as L3.
4. Keep agent cold reads out of the results. They find gaps in pages; they are not participants.
