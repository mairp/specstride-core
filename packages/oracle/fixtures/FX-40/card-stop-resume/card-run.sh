#!/bin/sh
# FX-40 card scenarios: end the card with an interrupt after its second board.
LAUNCH='import os, signal, sys
signal.signal(signal.SIGINT, signal.SIG_DFL)
os.execvp(sys.argv[1], sys.argv[1:])'
out=`mktemp "${TMPDIR:-/tmp}/fx40-card.XXXXXX"` || exit 70
python3 -c "$LAUNCH" "$@" > "$out" &
pid=$!
tries=0
while [ "$tries" -lt 400 ]; do
    if [ "`wc -c < "$out"`" -gt 8 ]; then
        break
    fi
    sleep 0.02
    tries=$((tries + 1))
done
first=`wc -c < "$out"`
tries=0
while [ "$tries" -lt 400 ]; do
    if [ "`wc -c < "$out"`" -ge $((first * 2)) ]; then
        break
    fi
    sleep 0.02
    tries=$((tries + 1))
done
kill -INT "$pid" 2>/dev/null
wait "$pid"
status=$?
cat "$out"
rm -f "$out"
exit "$status"
