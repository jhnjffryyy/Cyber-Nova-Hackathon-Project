The Traveler's Dilemma A Game Theory Analysis
IS373 - Quantitative Analysis
Cariño, Jasper Angelo B
Mesina, Jan Jefferson C

Introduction

Two travelers buy identical antiques on a trip, and an airline loses both in their luggage. The airline manager offers compensation but does not know the antiques' true value. The manager then applies a rule that rewards the lower claim and penalizes the higher claim.

The Payoff Rule

Both claim the same amount x: each receives x. Claims differ: let m be the lower claim. The player who claimed m receives m + R. The player who claimed the higher amount receives m - R.

Examples: (60, 60) gives 60 to each player. (100, 99) gives 99 + 2 = 101 to the lower claimer and 99 - 2 = 97 to the higher claimer. (100, 2) gives 4 to the lower claimer and 0 to the higher claimer.

Nash Equilibrium Analysis

Method 1: Best-Response Reasoning

Suppose Player 2 claims y > 2. Player 1's options are: Claim y: payoff = y. Claim y - 1: payoff = (y - 1) + 2 = y + 1. This beats claiming y. Claim anything lower than y - 1, say m: payoff = m + 2 < y + 1. Claim higher than y: payoff = y - 2, which is worse. So the best response to any y > 2 is y - 1, which means undercutting by one.

If Player 2 claims 2, Player 1's best response is 2 (payoff 2). Any higher claim yields 2 - 2 = 0.

The game is symmetric, so the same holds for Player 2.

Check whether any pair (a, b) with a = b > 2 is stable: each player gains by deviating to a - 1. If the claims differ, the higher claimer gains by moving to just below the lower claim. Neither is an equilibrium.

Only (2, 2) has each player best-responding to the other. It is the unique pure-strategy Nash equilibrium, with payoff (2, 2).

Method 2: Iterated Elimination of Weakly Dominated Strategies

Claiming 100 is weakly dominated by 99. Against any claim of 98 or lower, the two claims give the same payoff. Against 99, claiming 100 yields 97 versus 99; against 100, it yields 100 versus 101. So 99 does at least as well everywhere and strictly better against 99 and 100.

Conclusion

The Traveler's Dilemma shows that rational players end up at the lowest possible claim, even though both would prefer a higher payoff. The Nash equilibrium is (2, 2), which is far from the socially optimal outcome.
