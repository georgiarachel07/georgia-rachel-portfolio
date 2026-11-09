"""Mirror GitHub's anonymous public contribution calendar without a token."""
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import calendar
import json
import re
import time
import urllib.request

USER = 'georgiarachel07'
ROOT = Path(__file__).resolve().parents[1]


class CalendarParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.days, self.labels = {}, {}
        self.target = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'data-date' in attrs:
            self.days[attrs['id']] = {'date': attrs['data-date'], 'level': int(attrs['data-level'])}
        if tag == 'tool-tip':
            self.target = attrs.get('for')
            self.labels[self.target] = ''

    def handle_data(self, text):
        if self.target:
            self.labels[self.target] += text

    def handle_endtag(self, tag):
        if tag == 'tool-tip':
            self.target = None

    def result(self, year):
        result = []
        for key, day in self.days.items():
            if year is not None and not day['date'].startswith(f'{year}-'):
                continue
            label = self.labels.get(key, '').strip()
            match = re.match(r'(No|[\d,]+) contributions? on ', label)
            if not match:
                raise ValueError(f'Missing count for {day["date"]}')
            count = 0 if match[1] == 'No' else int(match[1].replace(',', ''))
            if not 0 <= day['level'] <= 4 or count < 0:
                raise ValueError('Invalid contribution')
            result.append({**day, 'count': count})
        result.sort(key=lambda day: day['date'])
        if year is None:
            if not 365 <= len(result) <= 367 or len({d['date'] for d in result}) != len(result):
                raise ValueError('Incomplete rolling calendar')
            return result
        expected = 366 if calendar.isleap(year) else 365
        if len(result) != expected or len({d['date'] for d in result}) != expected:
            raise ValueError(f'Incomplete {year} calendar: {len(result)} days')
        return result


def fetch_year(year=None):
    url = f'https://github.com/users/{USER}/contributions'
    if year is not None:
        end = min(date(year, 12, 31), datetime.now(timezone.utc).date()).isoformat()
        url += f'?from={year}-01-01&to={end}'
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={
                'User-Agent': 'GeorgiaRachelPortfolio/1.0',
                'Accept': 'text/html', 'X-Requested-With': 'XMLHttpRequest'})
            with urllib.request.urlopen(request, timeout=30) as response:
                parser = CalendarParser()
                parser.feed(response.read().decode('utf-8'))
            return parser.result(year)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def main():
    current = datetime.now(timezone.utc).year
    with ThreadPoolExecutor(max_workers=3) as executor:
        contributions = [d for days in executor.map(fetch_year, range(2019, current + 1)) for d in days]
    data = {
        'username': USER, 'source': f'https://github.com/{USER}',
        'updatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'total': {str(year): sum(d['count'] for d in contributions if d['date'].startswith(f'{year}-'))
                  for year in range(2019, current + 1)},
        'contributions': contributions, 'recentContributions': fetch_year()}
    # Keep the last good snapshot if any requested year is incomplete or invalid.
    (ROOT / 'assets/github-history.json').write_text(json.dumps(data, separators=(',', ':')) + '\n', encoding='utf-8')
    print('Public GitHub calendar refreshed:', data['total'])


if __name__ == '__main__':
    main()

