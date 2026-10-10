import assert from 'node:assert/strict';
import { handleScheduleMessage, PendingState } from '../src/lib/schedule-assistant.ts';
import { courseOccursOn, listOccurrences } from '../src/lib/dates.ts';
import { Course } from '../src/types/index.ts';

const NOW = new Date(2026, 9, 10, 10, 0); // Saturday, Oct 10 2026
let passed = 0;
function ok(name: string, cond: boolean, extra?: unknown) {
  assert(cond, `${name} :: ${JSON.stringify(extra)}`);
  passed++;
  console.log(`ok - ${name}`);
}
const noCourses: Course[] = [];

// 1. Weekly Monday class
{
  const r = handleScheduleMessage('Add a Web Development class every Monday at 8 AM', null, noCourses, NOW);
  ok('1 kind add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('1 title', r.course.title === 'Web Development', r.course);
    ok('1 days', JSON.stringify(r.course.days) === '["Mon"]', r.course.days);
    ok('1 no date', r.course.date === undefined, r.course.date);
    ok('1 time', r.course.startTime === '08:00' && r.course.endTime === '09:00', r.course);
    ok('1 msg default note', r.message.includes('(1 hour by default)'), r.message);
  }
}

// 2. Range + room + instructor
{
  const r = handleScheduleMessage(
    'Add Calculus every Tuesday and Thursday from 1:30 to 3pm in Room 204 with Prof. Santos',
    null, noCourses, NOW
  );
  ok('2 add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('2 days', JSON.stringify(r.course.days) === '["Tue","Thu"]', r.course.days);
    ok('2 time', r.course.startTime === '13:30' && r.course.endTime === '15:00', r.course);
    ok('2 room', r.course.room === 'Room 204', r.course.room);
    ok('2 instructor', r.course.instructor === 'Prof. Santos', r.course.instructor);
  }
}

// 3. Bare day name asks recurrence
{
  const r1 = handleScheduleMessage('Add Physics Lab on Monday at 2pm', null, noCourses, NOW);
  ok('3 asks recurrence', r1.kind === 'ask' && r1.pending.awaiting === 'recurrence', r1);
  if (r1.kind === 'ask') {
    const r2 = handleScheduleMessage('every week', r1.pending, noCourses, NOW);
    ok('3 weekly add', r2.kind === 'add', r2);
    if (r2.kind === 'add') {
      ok('3 weekly days', JSON.stringify(r2.course.days) === '["Mon"]' && !r2.course.date, r2.course);
      ok('3 weekly time', r2.course.startTime === '14:00' && r2.course.endTime === '15:00', r2.course);
    }
    const r3 = handleScheduleMessage('only once', r1.pending, noCourses, NOW);
    ok('3 once add', r3.kind === 'add', r3);
    if (r3.kind === 'add') {
      ok('3 once date', r3.course.date === '2026-10-12', r3.course.date);
      ok('3 once days', JSON.stringify(r3.course.days) === '["Mon"]', r3.course.days);
    }
  }
}

// 4. Ambiguous hour asks am/pm
{
  const r1 = handleScheduleMessage('Add Chemistry every Wednesday at 8', null, noCourses, NOW);
  ok('4 asks ampm', r1.kind === 'ask' && r1.pending.awaiting === 'ampm', r1);
  if (r1.kind === 'ask') {
    const r2 = handleScheduleMessage('pm', r1.pending, noCourses, NOW);
    ok('4 add', r2.kind === 'add', r2);
    if (r2.kind === 'add') ok('4 time', r2.course.startTime === '20:00' && r2.course.endTime === '21:00', r2.course);
  }
}

// 5. Missing time asks time
{
  const r1 = handleScheduleMessage('Add Biology every Friday', null, noCourses, NOW);
  ok('5 asks time', r1.kind === 'ask' && r1.pending.awaiting === 'time', r1);
  if (r1.kind === 'ask') {
    const r2 = handleScheduleMessage('9am to 10:30am', r1.pending, noCourses, NOW);
    ok('5 add', r2.kind === 'add', r2);
    if (r2.kind === 'add') ok('5 time', r2.course.startTime === '09:00' && r2.course.endTime === '10:30', r2.course);
  }
}

// 6. Missing title asks title
{
  const r1 = handleScheduleMessage('add every monday at 9am', null, noCourses, NOW);
  ok('6 asks title', r1.kind === 'ask' && r1.pending.awaiting === 'title', r1);
  if (r1.kind === 'ask') {
    const r2 = handleScheduleMessage('Data Structures', r1.pending, noCourses, NOW);
    ok('6 add', r2.kind === 'add', r2);
    if (r2.kind === 'add') ok('6 title', r2.course.title === 'Data Structures', r2.course);
  }
}

// 7. Tomorrow + duration
{
  const r = handleScheduleMessage('Add Review session tomorrow at 3pm for 2 hours', null, noCourses, NOW);
  ok('7 add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('7 date', r.course.date === '2026-10-11', r.course.date);
    ok('7 days', JSON.stringify(r.course.days) === '["Sun"]', r.course.days);
    ok('7 time', r.course.startTime === '15:00' && r.course.endTime === '17:00', r.course);
    ok('7 title', r.course.title === 'Review session', r.course.title);
  }
}

// 8. Month-name date
{
  const r = handleScheduleMessage('Add Thesis meeting on October 20 at 10am', null, noCourses, NOW);
  ok('8 add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('8 date', r.course.date === '2026-10-20', r.course.date);
    ok('8 days', JSON.stringify(r.course.days) === '["Tue"]', r.course.days);
    ok('8 title', r.course.title === 'Thesis meeting', r.course.title);
  }
}

// 9. End before start asks endTime
{
  const r1 = handleScheduleMessage('Add Seminar every Monday from 3pm to 1pm', null, noCourses, NOW);
  ok('9 asks endTime', r1.kind === 'ask' && r1.pending.awaiting === 'endTime', r1);
  if (r1.kind === 'ask') {
    const r2 = handleScheduleMessage('until 5pm', r1.pending, noCourses, NOW);
    ok('9 add', r2.kind === 'add', r2);
    if (r2.kind === 'add') ok('9 time', r2.course.startTime === '15:00' && r2.course.endTime === '17:00', r2.course);
  }
}

// 10. Conflict ask, then yes/no
{
  const existing: Course[] = [{
    id: 'c1', code: 'ALGO', title: 'Algorithms', units: 3, days: ['Mon'],
    startTime: '08:00', endTime: '09:30', color: '#3B82F6',
  }];
  const r1 = handleScheduleMessage('Add Web Dev every Monday at 9am', null, existing, NOW);
  ok('10 asks conflict', r1.kind === 'ask' && r1.pending.awaiting === 'conflict', r1);
  if (r1.kind === 'ask') {
    const r2 = handleScheduleMessage('yes', r1.pending, existing, NOW);
    ok('10 yes adds', r2.kind === 'add', r2);
    const r3 = handleScheduleMessage('no', r1.pending, existing, NOW);
    ok('10 no info', r3.kind === 'info', r3);
  }
}

// 11. Cancel while pending
{
  const r1 = handleScheduleMessage('Add Biology every Friday', null, noCourses, NOW);
  if (r1.kind === 'ask') {
    const r2 = handleScheduleMessage('cancel', r1.pending, noCourses, NOW);
    ok('11 cancel info', r2.kind === 'info' && /cancelled/i.test(r2.message), r2);
  }
}

// 12-13. daily / weekdays
{
  const r = handleScheduleMessage('Add Gym daily at 6am', null, noCourses, NOW);
  ok('12 add', r.kind === 'add', r);
  if (r.kind === 'add') ok('12 all days', r.course.days.length === 7, r.course.days);
  const r2 = handleScheduleMessage('Add Art every weekday at 10am', null, noCourses, NOW);
  ok('13 add', r2.kind === 'add', r2);
  if (r2.kind === 'add') ok('13 weekdays', JSON.stringify(r2.course.days) === '["Mon","Tue","Wed","Thu","Fri"]', r2.course.days);
}

// 14. Past ISO date asks
{
  const r = handleScheduleMessage('Add Exam on 2026-10-01 at 9am', null, noCourses, NOW);
  ok('14 past asks', r.kind === 'ask' && r.pending.awaiting === 'date', r);
}

// 15. Greeting -> info
{
  const r = handleScheduleMessage('hello', null, noCourses, NOW);
  ok('15 info', r.kind === 'info', r);
}

// 16. Course-code title with digits is not a time
{
  const r = handleScheduleMessage('Add CS 101 every Monday at 10am', null, noCourses, NOW);
  ok('16 add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('16 title', r.course.title === 'CS 101', r.course.title);
    ok('16 time', r.course.startTime === '10:00', r.course.startTime);
  }
}

// 17. Saturday + noon
{
  const r = handleScheduleMessage('Add History every Sat at noon', null, noCourses, NOW);
  ok('17 add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('17 day', JSON.stringify(r.course.days) === '["Sat"]', r.course.days);
    ok('17 time', r.course.startTime === '12:00' && r.course.endTime === '13:00', r.course);
  }
}

// 18. Exact duplicate -> info
{
  const existing: Course[] = [{
    id: 'c1', code: 'WEBDEV', title: 'Web Development', units: 3, days: ['Mon'],
    startTime: '08:00', endTime: '09:00', color: '#3B82F6',
  }];
  const r = handleScheduleMessage('Add Web Development every Monday at 8am', null, existing, NOW);
  ok('18 duplicate info', r.kind === 'info', r);
}

// 19. Bare day name resolving to today with a past start time -> next week's occurrence
{
  const r1 = handleScheduleMessage('Can you add PE on Saturday morning at 7', null, noCourses, NOW);
  ok('19 asks recurrence', r1.kind === 'ask' && r1.pending.awaiting === 'recurrence', r1);
  if (r1.kind === 'ask') {
    ok('19 shows next week', r1.message.includes('October 17'), r1.message);
    const r2 = handleScheduleMessage('only once', r1.pending, noCourses, NOW);
    ok('19 once add', r2.kind === 'add', r2);
    if (r2.kind === 'add') {
      ok('19 date next Sat', r2.course.date === '2026-10-17', r2.course.date);
      ok('19 time', r2.course.startTime === '07:00', r2.course.startTime);
    }
  }
}

// 20. Explicit "today" with a past time -> asks for the intended date/time
{
  const r1 = handleScheduleMessage('Add Meeting today at 8am', null, noCourses, NOW);
  ok('20 past-time asks date', r1.kind === 'ask' && r1.pending.awaiting === 'date' && /already passed today/.test(r1.message), r1);
  if (r1.kind === 'ask') {
    const r2 = handleScheduleMessage('tomorrow', r1.pending, noCourses, NOW);
    ok('20 tomorrow adds', r2.kind === 'add', r2);
    if (r2.kind === 'add') ok('20 date', r2.course.date === '2026-10-11', r2.course.date);
  }
}

// 21. Explicit "today" with a future time still resolves to today
{
  const r = handleScheduleMessage('Add Yoga today at 11am', null, noCourses, NOW);
  ok('21 add', r.kind === 'add', r);
  if (r.kind === 'add') ok('21 date today', r.course.date === '2026-10-10', r.course.date);
}

// a. Month range with explicit year
{
  const r = handleScheduleMessage('Schedule Web Development every Monday at 8am for October 2026', null, noCourses, NOW);
  console.log('  [a reply]', r.kind === 'add' ? r.message : JSON.stringify(r));
  ok('a add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('a bounds', r.course.startDate === '2026-10-01' && r.course.endDate === '2026-10-31', r.course);
    const occ = listOccurrences(r.course);
    ok('a occurrences', JSON.stringify(occ) === '["2026-10-05","2026-10-12","2026-10-19","2026-10-26"]', occ);
    ok('a msg lists dates', r.message.includes('October 5, 12, 19 and 26, 2026'), r.message);
    const mkDay = (iso: string) => ({ name: 'Mon' as const, date: new Date(iso + 'T00:00:00'), iso, dayNum: Number(iso.slice(8)), isToday: false });
    ok('a occurs in range', courseOccursOn(r.course, mkDay('2026-10-12')), '');
    ok('a not Nov 2', !courseOccursOn(r.course, mkDay('2026-11-02')), '');
    ok('a not Sep 28', !courseOccursOn(r.course, mkDay('2026-09-28')), '');
  }
}

// b. Daily for N days (today's 6am already passed, so starts tomorrow)
{
  const r = handleScheduleMessage('Add Gym daily at 6am for 5 days', null, noCourses, NOW);
  console.log('  [b reply]', r.kind === 'add' ? r.message : JSON.stringify(r));
  ok('b add', r.kind === 'add', r);
  if (r.kind === 'add') {
    const occ = listOccurrences(r.course);
    ok('b occurrences', JSON.stringify(occ) === '["2026-10-11","2026-10-12","2026-10-13","2026-10-14","2026-10-15"]', occ);
  }
}

// c. for N weeks
{
  const r = handleScheduleMessage('Add Calculus every Tue and Thu at 1pm for 2 weeks', null, noCourses, NOW);
  console.log('  [c reply]', r.kind === 'add' ? r.message : JSON.stringify(r));
  ok('c add', r.kind === 'add', r);
  if (r.kind === 'add') {
    const occ = listOccurrences(r.course);
    ok('c occurrences', JSON.stringify(occ) === '["2026-10-13","2026-10-15","2026-10-20","2026-10-22"]', occ);
  }
}

// d. until end date, today still counts (7pm not passed)
{
  const r = handleScheduleMessage('Add Yoga every Saturday at 7pm until November 7', null, noCourses, NOW);
  ok('d add', r.kind === 'add', r);
  if (r.kind === 'add') {
    const occ = listOccurrences(r.course);
    ok('d occurrences', JSON.stringify(occ) === '["2026-10-10","2026-10-17","2026-10-24","2026-10-31","2026-11-07"]', occ);
  }
}

// e. range with zero matching weekdays asks
{
  const r = handleScheduleMessage('Add Review every Monday at 9am from Oct 6 to Oct 11', null, noCourses, NOW);
  console.log('  [e reply]', r.kind === 'ask' ? r.message : JSON.stringify(r));
  ok('e asks', r.kind === 'ask' && /no Mondays/i.test(r.message), r);
}

// f. end before start asks
{
  const r = handleScheduleMessage('Add Lab every Friday at 2pm from Nov 20 to Nov 1', null, noCourses, NOW);
  ok('f asks', r.kind === 'ask' && /before the start/i.test(r.message), r);
}

// g. month without year: current month OK, fully past month asks
{
  const r1 = handleScheduleMessage('Add Art every Monday at 10am for October', null, noCourses, NOW);
  ok('g oct adds', r1.kind === 'add', r1);
  if (r1.kind === 'add') {
    ok('g oct bounds', r1.course.startDate === '2026-10-01' && r1.course.endDate === '2026-10-31', r1.course);
    ok('g oct 4 mondays', listOccurrences(r1.course).length === 4, listOccurrences(r1.course));
  }
  const r2 = handleScheduleMessage('Add Art every Monday at 10am for March', null, noCourses, NOW);
  console.log('  [g reply]', r2.kind === 'ask' ? r2.message : JSON.stringify(r2));
  ok('g march asks', r2.kind === 'ask' && r2.message.includes('March 2027'), r2);
}

// h. N times
{
  const r = handleScheduleMessage('Add Physics every Wednesday at 3pm 4 times', null, noCourses, NOW);
  ok('h add', r.kind === 'add', r);
  if (r.kind === 'add') {
    const occ = listOccurrences(r.course);
    ok('h occurrences', JSON.stringify(occ) === '["2026-10-14","2026-10-21","2026-10-28","2026-11-04"]', occ);
  }
}

// i. weekly with no day asks
{
  const r = handleScheduleMessage('Add Seminar weekly at 2pm', null, noCourses, NOW);
  ok('i asks days', r.kind === 'ask' && r.pending.awaiting === 'day', r);
}

// j. range-aware conflict: Oct-bounded course does not conflict with November
{
  const existing: Course[] = [{
    id: 'c1', code: 'WEB', title: 'Web Dev', units: 3, days: ['Mon'],
    startTime: '08:00', endTime: '09:00', color: '#3B82F6',
    startDate: '2026-10-01', endDate: '2026-10-31',
  }];
  const r = handleScheduleMessage('Add Chem every Monday at 8am for November 2026', null, existing, NOW);
  ok('j no conflict add', r.kind === 'add', r);
}

// k. invalid calendar date asks
{
  const r = handleScheduleMessage('Add Xyz every Monday at 8am from Feb 30 to Mar 10', null, noCourses, NOW);
  ok('k asks invalid', r.kind === 'ask' && /could not understand that date/i.test(r.message), r);
}

// l. "this October" bounds the recurrence to the month
{
  const r = handleScheduleMessage('Add OS every Monday and Wednesday 10-11:30am this October', null, noCourses, NOW);
  console.log('  [l reply]', r.kind === 'add' ? r.message : JSON.stringify(r));
  ok('l add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('l bounds', r.course.startDate === '2026-10-01' && r.course.endDate === '2026-10-31', r.course);
    ok('l days', JSON.stringify(r.course.days) === '["Mon","Wed"]', r.course.days);
    ok('l time', r.course.startTime === '10:00' && r.course.endTime === '11:30', r.course);
  }
}

// m. "this month" = current month bounds
{
  const r = handleScheduleMessage('Add Gym every Friday at 6pm this month', null, noCourses, NOW);
  ok('m add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('m bounds', r.course.startDate === '2026-10-01' && r.course.endDate === '2026-10-31', r.course);
  }
}

// n. "next month" = next month bounds
{
  const r = handleScheduleMessage('Add Club every Tuesday at 3pm next month', null, noCourses, NOW);
  ok('n add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('n bounds', r.course.startDate === '2026-11-01' && r.course.endDate === '2026-11-30', r.course);
  }
}

// o. "this week" = Mon-Sun of the current week
{
  const r = handleScheduleMessage('Add Quiz every day at 7pm this week', null, noCourses, NOW);
  ok('o add', r.kind === 'add', r);
  if (r.kind === 'add') {
    ok('o bounds', r.course.startDate === '2026-10-05' && r.course.endDate === '2026-10-11', r.course);
  }
}

// p. unparseable month-ish word: no crash, either ask or add
{
  const r = handleScheduleMessage('Add Debate every Monday at 5pm octobr', null, noCourses, NOW);
  ok('p no crash', r.kind === 'ask' || r.kind === 'add', r);
}

console.log(`\n${passed} schedule assertions passed`);
