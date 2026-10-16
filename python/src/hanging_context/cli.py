"""Command line interface: hanging-context ask|latest|story|topics."""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import List, Optional

import hanging_context as hc

DESCRIPTION = (
    "Stories for AI agents, with cited sources. Free. No key. https://hangingcontext.com\n"
    "Hanging Context, with provenance by Synorb."
)


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="hanging-context", description=DESCRIPTION, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    p.add_argument("--version", action="version", version=hc.__version__)
    sub = p.add_subparsers(dest="cmd")

    a = sub.add_parser("ask", help="answer a question from recent stories")
    a.add_argument("question", nargs="+")
    a.add_argument("--topic")
    a.add_argument("--days", type=int)
    a.add_argument("--limit", type=int)
    a.add_argument("--json", action="store_true")

    la = sub.add_parser("latest", help="show the latest stories")
    la.add_argument("--topic")
    la.add_argument("--json", action="store_true")

    s = sub.add_parser("story", help="show one story")
    s.add_argument("date", help="YYYY-MM-DD (UTC)")
    s.add_argument("slug")
    s.add_argument("--md", action="store_true", help="print Markdown")

    t = sub.add_parser("topics", help="list topics")
    t.add_argument("--json", action="store_true")
    return p


def _dump(obj: object) -> None:
    print(json.dumps(obj, indent=2, ensure_ascii=False))


def main(argv: Optional[List[str]] = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    if not args.cmd:
        parser.print_help()
        return 0
    base = os.environ.get("HC_BASE_URL") or None
    try:
        if args.cmd == "ask":
            r = hc.ask(" ".join(args.question), topic=args.topic, days=args.days, limit=args.limit, base_url=base)
            if args.json:
                _dump(r)
            elif r.get("no_match") or not r.get("results"):
                print("No match in recent stories.")
            else:
                for x in r["results"]:
                    print("- %s" % x.get("name"))
                    print("  %s" % x.get("description"))
                    print("  %s" % x.get("url"))
                    if x.get("manifest_ids"):
                        print("  Manifests: %s" % ", ".join(x["manifest_ids"]))
        elif args.cmd == "latest":
            r = hc.latest(topic=args.topic, base_url=base)
            if args.json:
                _dump(r)
            else:
                for s in r.get("stories", []):
                    print("- %s" % s.get("headline"))
                    if s.get("dek"):
                        print("  %s" % s["dek"])
                    print("  %s  (%s sources)" % (s.get("url"), s.get("source_count", "?")))
        elif args.cmd == "story":
            r = hc.story(args.date, args.slug, format="md" if args.md else "json", base_url=base)
            if args.md:
                print(r)
            else:
                _dump(r)
        elif args.cmd == "topics":
            r = hc.topics(base_url=base)
            if args.json:
                _dump(r)
            else:
                for t in r:
                    print("%s  %s" % (t.get("id"), t.get("title")))
    except hc.HangingContextError as err:
        suffix = " (%s)" % err.code if err.code else ""
        print("Error: %s%s" % (err.message, suffix), file=sys.stderr)
        if err.next_step:
            print(err.next_step, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
