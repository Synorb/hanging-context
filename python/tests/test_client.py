import io
import json
import os
import unittest
import urllib.error
from contextlib import redirect_stderr, redirect_stdout
from unittest import mock

import hanging_context as hc
from hanging_context import cli


class FakeResponse:
    def __init__(self, body):
        self._b = body if isinstance(body, str) else json.dumps(body)

    def read(self):
        return self._b.encode()

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def http_error(code, body):
    raw = body if isinstance(body, str) else json.dumps(body)
    return urllib.error.HTTPError("u", code, "x", {}, io.BytesIO(raw.encode()))


class ClientTests(unittest.TestCase):
    def test_ask_posts_body(self):
        with mock.patch("urllib.request.urlopen", return_value=FakeResponse({"query": "r", "results": []})) as m:
            r = hc.ask("rates", topic="finance-investing", days=3)
        req = m.call_args[0][0]
        self.assertEqual(req.full_url, "https://hangingcontext.com/ask")
        self.assertEqual(req.get_method(), "POST")
        self.assertEqual(json.loads(req.data), {"query": "rates", "topic": "finance-investing", "days": 3})
        self.assertEqual(r["query"], "r")

    def test_ask_empty_no_request(self):
        with mock.patch("urllib.request.urlopen") as m:
            with self.assertRaises(hc.HangingContextError):
                hc.ask("  ")
        m.assert_not_called()

    def test_error_body(self):
        body = {"error": "empty_question", "message": "The question is empty.", "next_step": "Send one."}
        with mock.patch("urllib.request.urlopen", side_effect=http_error(400, body)):
            with self.assertRaises(hc.HangingContextError) as cm:
                hc.ask("x")
        e = cm.exception
        self.assertEqual((e.status, e.code, e.next_step, e.body), (400, "empty_question", "Send one.", body))

    def test_429_retry_after(self):
        err = http_error(429, {"error": "rate_limited", "message": "Slow", "retry_after": 30})
        with mock.patch("urllib.request.urlopen", side_effect=err):
            with self.assertRaises(hc.HangingContextError) as cm:
                hc.latest()
        self.assertEqual(cm.exception.retry_after, 30)

    def test_non_json_error(self):
        with mock.patch("urllib.request.urlopen", side_effect=http_error(502, "<html>bad</html>")):
            with self.assertRaises(hc.HangingContextError) as cm:
                hc.latest()
        self.assertEqual(cm.exception.status, 502)
        self.assertIn("bad", cm.exception.body)

    def test_network_error(self):
        with mock.patch("urllib.request.urlopen", side_effect=urllib.error.URLError("down")):
            with self.assertRaises(hc.HangingContextError) as cm:
                hc.latest()
        self.assertEqual(cm.exception.status, 0)

    def test_urls(self):
        with mock.patch("urllib.request.urlopen", return_value=FakeResponse({"stories": []})) as m:
            hc.latest()
            hc.latest(topic="artificial-intelligence")
            hc.story("2026-10-16", "a-b")
        urls = [c[0][0].full_url for c in m.call_args_list]
        self.assertEqual(
            urls,
            [
                "https://hangingcontext.com/editions/latest.json",
                "https://hangingcontext.com/n/artificial-intelligence/index.json",
                "https://hangingcontext.com/stories/2026-10-16/a-b/index.json",
            ],
        )

    def test_story_md(self):
        with mock.patch("urllib.request.urlopen", return_value=FakeResponse("# hi")) as m:
            self.assertEqual(hc.story("2026-10-16", "a-b", format="md"), "# hi")
        self.assertTrue(m.call_args[0][0].full_url.endswith("/index.md"))

    def test_validation(self):
        for call in (
            lambda: hc.latest(topic="../etc"),
            lambda: hc.story("yesterday", "a"),
            lambda: hc.story("2026-10-16", "A B"),
            lambda: hc.story("2026-10-16", "a", format="xml"),
        ):
            with self.assertRaises(hc.HangingContextError):
                call()

    def test_topics(self):
        with mock.patch("urllib.request.urlopen", return_value=FakeResponse({"newsrooms": [{"id": "x", "title": "X"}]})):
            self.assertEqual(hc.topics(), [{"id": "x", "title": "X"}])

    def test_base_url(self):
        with mock.patch("urllib.request.urlopen", return_value=FakeResponse({})) as m:
            hc.latest(base_url="http://localhost:9/")
        self.assertEqual(m.call_args[0][0].full_url, "http://localhost:9/editions/latest.json")


class CliTests(unittest.TestCase):
    def run_cli(self, argv, reply):
        out, err = io.StringIO(), io.StringIO()
        with mock.patch("urllib.request.urlopen", return_value=FakeResponse(reply)):
            with redirect_stdout(out), redirect_stderr(err):
                code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_topics(self):
        code, out, _ = self.run_cli(["topics"], {"newsrooms": [{"id": "ai", "title": "AI"}]})
        self.assertEqual((code, out), (0, "ai  AI\n"))

    def test_ask(self):
        reply = {"results": [{"name": "N", "description": "D", "url": "U", "manifest_ids": ["1"]}]}
        code, out, _ = self.run_cli(["ask", "central", "banks", "--days", "2"], reply)
        self.assertEqual(out, "- N\n  D\n  U\n  Manifests: 1\n")

    def test_error_exit(self):
        out, err = io.StringIO(), io.StringIO()
        e = http_error(400, {"error": "empty_question", "message": "Empty.", "next_step": "Ask."})
        with mock.patch("urllib.request.urlopen", side_effect=e):
            with redirect_stdout(out), redirect_stderr(err):
                code = cli.main(["ask", "x"])
        self.assertEqual(code, 1)
        self.assertIn("empty_question", err.getvalue())

    def test_version(self):
        with redirect_stdout(io.StringIO()) as out:
            with self.assertRaises(SystemExit):
                cli.main(["--version"])
        self.assertEqual(out.getvalue().strip(), "0.1.0")


@unittest.skipUnless(os.environ.get("HC_LIVE") == "1", "set HC_LIVE=1 to run against hangingcontext.com")
class LiveSmoke(unittest.TestCase):
    def test_live(self):
        l = hc.latest()
        self.assertTrue(l["stories"])
        t = hc.topics()
        self.assertTrue(t)
        self.assertIsInstance(hc.latest(topic=t[0]["id"])["stories"], list)
        first = l["stories"][0]
        date = first["url"].split("/stories/")[1].split("/")[0]
        self.assertEqual(hc.story(date, first["slug"])["slug"], first["slug"])
        self.assertTrue(hc.story(date, first["slug"], format="md").startswith("---"))
        self.assertIn("results", hc.ask("central bank rates", days=7))
        with self.assertRaises(hc.HangingContextError) as cm:
            hc.story("2000-01-01", "no-such-story")
        self.assertEqual(cm.exception.status, 404)


if __name__ == "__main__":
    unittest.main()
