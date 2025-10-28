// Test script to verify the period calculation logic

// Import the functions (simulate the logic)
const BELL_SCHEDULE = [
  { start: "07:30", end: "08:15", name: "0. óra" },
  { start: "08:25", end: "09:10", name: "1. óra" },
  { start: "09:20", end: "10:05", name: "2. óra" },
  { start: "10:20", end: "11:05", name: "3. óra" },
  { start: "11:15", end: "12:00", name: "4. óra" },
  { start: "12:20", end: "13:05", name: "5. óra" },
  { start: "13:25", end: "14:10", name: "6. óra" },
  { start: "14:20", end: "15:05", name: "7. óra" },
  { start: "15:15", end: "16:00", name: "8. óra" },
];

function getImpactedPeriods(start, end) {
  const impacted = [];
  
  BELL_SCHEDULE.forEach((period, index) => {
    const [startHour, startMin] = period.start.split(':').map(Number);
    const [endHour, endMin] = period.end.split(':').map(Number);
    
    const periodStart = new Date(start);
    periodStart.setHours(startHour, startMin, 0, 0);
    
    const periodEnd = new Date(start);
    periodEnd.setHours(endHour, endMin, 0, 0);
    
    if (start < periodEnd && end > periodStart) {
      impacted.push(index);
    }
  });
  
  return impacted;
}

function getCorrectedPeriods(originalPeriods, minutesBefore, minutesAfter) {
  const corrected = [];
  
  if (originalPeriods.length === 0) return corrected;
  
  if (minutesBefore >= 45) {
    const firstPeriod = Math.min(...originalPeriods);
    if (firstPeriod > 0) {
      corrected.push(firstPeriod - 1);
    }
  }
  
  if (minutesAfter >= 45) {
    const lastPeriod = Math.max(...originalPeriods);
    if (lastPeriod < 8) {
      corrected.push(lastPeriod + 1);
    }
  }
  
  return corrected;
}

// Test with the example data
const testCases = [
  {
    id: 1,
    eleje: "2025-10-26T10:00:00",
    vege: "2025-10-26T12:00:00",
    diak_extra_ido_elotte: null,
    diak_extra_ido_utana: null,
    expected_original: [2, 3, 4], // 10:00-12:00 should cover parts of 2nd, 3rd, 4th periods
    expected_corrected: []
  },
  {
    id: 3,
    eleje: "2025-10-28T10:00:00",
    vege: "2025-10-28T12:00:00",
    diak_extra_ido_elotte: 60,
    diak_extra_ido_utana: 180,
    expected_original: [2, 3, 4],
    expected_corrected: [1, 5] // 60 min before = add period 1, 180 min after = add periods 5
  },
  {
    id: 2,
    eleje: "2025-10-28T12:00:00",
    vege: "2025-10-28T16:00:00",
    diak_extra_ido_elotte: null,
    diak_extra_ido_utana: null,
    expected_original: [4, 5, 6, 7, 8], // 12:00-16:00 covers periods 4-8
    expected_corrected: []
  }
];

console.log("Testing period calculation logic...\n");

testCases.forEach(testCase => {
  const start = new Date(testCase.eleje);
  const end = new Date(testCase.vege);
  
  const originalPeriods = getImpactedPeriods(start, end);
  const correctedPeriods = getCorrectedPeriods(
    originalPeriods,
    testCase.diak_extra_ido_elotte || 0,
    testCase.diak_extra_ido_utana || 0
  );
  
  console.log(`Test case ${testCase.id}:`);
  console.log(`  Time: ${testCase.eleje} - ${testCase.vege}`);
  console.log(`  Extra time: ${testCase.diak_extra_ido_elotte || 0} min before, ${testCase.diak_extra_ido_utana || 0} min after`);
  console.log(`  Original periods: ${originalPeriods} (expected: ${testCase.expected_original})`);
  console.log(`  Corrected periods: ${correctedPeriods} (expected: ${testCase.expected_corrected})`);
  
  const originalMatch = JSON.stringify(originalPeriods.sort()) === JSON.stringify(testCase.expected_original.sort());
  const correctedMatch = JSON.stringify(correctedPeriods.sort()) === JSON.stringify(testCase.expected_corrected.sort());
  
  console.log(`  ✓ Original periods: ${originalMatch ? 'PASS' : 'FAIL'}`);
  console.log(`  ✓ Corrected periods: ${correctedMatch ? 'PASS' : 'FAIL'}`);
  console.log('');
});