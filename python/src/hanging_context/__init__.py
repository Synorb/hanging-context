"""Tiny client for Hanging Context (https://hangingcontext.com). Standard library only."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

__version__ = "0.1.0"
DEFAULT_BASE_URL = "https://hangingcontext.com"
__all__ = [
    "ask",
    "latest",
    "story",
    "topics",
    "HangingContextError",
    "DEFAULT_BASE_URL",
    "__version__",
]

_SLUG = re.compile(r"^[a-z0-9-]+$")
_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class HangingContextError(Exception):
    """Raised for any non-2xx reply, network failure or bad input.

    Attributes: status (0 for a network failure or bad input), code, next_step,
    retry_after (for 429) and body (parsed JSON error body, or raw text).
    """

    def __init__(
        self,
        message: str,
        status: int = 0,
        code: str = "",
        next_step: str = "",
        body: Any = None,
        retry_after: Optional[int] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.next_step = next_step
        self.body = body
        self.retry_after = retry_after


def _request(
    path: str,
    base_url: Optional[str] = None,
    data: Optional[dict] = None,
    accept: str = "application/json",
    as_text: bool = False,
    timeout: float = 30,
) -> Any:
    url = (base_url or DEFAULT_BASE_URL).rstrip("/") + path
    headers = {"Accept": accept, "User-Agent": "hanging-context-python/" + __version__}
    payload = None
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST" if payload else "GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            text = res.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(raw)
        except ValueError:
            parsed = None
        b = parsed if isinstance(parsed, dict) else {}
        raise HangingContextError(
            b.get("message") or "HTTP %d" % err.code,
            status=err.code,
            code=b.get("error", ""),
            next_step=b.get("next_step", ""),
            body=parsed if parsed is not None else raw,
            retry_after=b.get("retry_after"),
        ) from None
    except (urllib.error.URLError, OSError) as err:
        raise HangingContextError("Network error: %s" % err) from None
    if as_text:
        return text
    try:
        return json.loads(text)
    except ValueError:
        raise HangingContextError("The reply was not valid JSON.", body=text) from None


def _check_slug(name: str, value: Any) -> None:
    if not isinstance(value, str) or not _SLUG.match(value):
        raise HangingContextError("%s must be lowercase letters, digits and hyphens." % name)


def ask(
    question: str,
    topic: Optional[str] = None,
    days: Optional[int] = None,
    limit: Optional[int] = None,
    base_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Ask a question. The answer copies facts word for word from recent stories."""
    if not isinstance(question, str) or not question.strip():
        raise HangingContextError("The question is empty.")
    body: Dict[str, Any] = {"query": question}
    if topic is not None:
        _check_slug("topic", topic)
        body["topic"] = topic
    if days is not None:
        body["days"] = days
    if limit is not None:
        body["limit"] = limit
    return _request("/ask", base_url, data=body)


def latest(topic: Optional[str] = None, base_url: Optional[str] = None) -> Dict[str, Any]:
    """Get the latest stories, or the recent stories of one topic."""
    if topic is not None:
        _check_slug("topic", topic)
        return _request("/n/%s/index.json" % topic, base_url)
    return _request("/editions/latest.json", base_url)


def story(date: str, slug: str, format: str = "json", base_url: Optional[str] = None) -> Any:
    """Get one story. format "json" returns a dict; "md" returns Markdown text."""
    if not isinstance(date, str) or not _DATE.match(date):
        raise HangingContextError("date must look like YYYY-MM-DD.")
    _check_slug("slug", slug)
    if format == "md":
        return _request("/stories/%s/%s/index.md" % (date, slug), base_url, accept="text/markdown", as_text=True)
    if format != "json":
        raise HangingContextError('format must be "json" or "md".')
    return _request("/stories/%s/%s/index.json" % (date, slug), base_url)


def topics(base_url: Optional[str] = None) -> List[Dict[str, Any]]:
    """List the topics: dicts with id, title, url, json, description, beats."""
    data = latest(base_url=base_url)
    items = data.get("newsrooms")
    return items if isinstance(items, list) else []
