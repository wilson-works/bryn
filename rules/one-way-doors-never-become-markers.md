# One-way doors never become markers

**The rule.** A decision that cannot be undone gets a record in `log/adr/` every time it comes up, and never a
standing trail marker in `log/policies/`.

**How to check it.** No file in `log/policies/` was filed from a decision whose `meta.json` says `"door": "one-way"`.

**Why.** A marker answers the next question without a council. Doing that for a door that cannot be reopened throws
away exactly the care the decision needed.
