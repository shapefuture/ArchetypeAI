# Felt Cosmos deck sources

The visual companion to [../../felt-cosmos-redesign.md](../../felt-cosmos-redesign.md), published as a private Claude artifact.

Rebuild the single-file page (images are inlined as data URIs):

```bash
python3 -I docs/plans/felt-cosmos/deck/build_deck.py docs/plans/felt-cosmos/deck docs/plans/felt-cosmos/assets docs/plans/felt-cosmos/deck/thumbs /tmp/felt-cosmos-deck.html
```

`thumbs/` holds 240 px screenshots of the current app (`a1`–`a10`) and of the proposal mockups (`m1`–`m10`). The built page is not committed.
