import fs from 'fs';
import path from 'path';

function assert(description: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description} ${detail ? `(${detail})` : ''}`);
    process.exit(1);
  }
}

async function verifyExamCloseOption() {
  console.log('🛡️ Verifying Practice Assessment Close & Exit Options...\n');

  const examPagePath = path.resolve('apps/web/app/exam/[sessionId]/page.tsx');
  const examContent = fs.readFileSync(examPagePath, 'utf-8');

  // 1. Launchpad Pre-flight Check Modal
  console.log('📌 1. Candidate Pre-Flight Launchpad Modal:');
  assert(
    'Top-right close button (X) is present in launchpad modal header',
    examContent.includes('<X className="w-5 h-5"') && examContent.includes("title=\"Close and return to problem list\"")
  );
  assert(
    'Cancel & Close button present in launchpad modal actions',
    examContent.includes('Cancel & Close') && examContent.includes("onClick={() => router.push('/problems')}")
  );

  // 2. Main Exam Header
  console.log('\n📌 2. Practice Assessment Header:');
  assert(
    '← Exit link is present in the exam header bar',
    examContent.includes('href="/problems"') && examContent.includes('← Exit')
  );

  // 3. Full-Screen Enforcement Overlay
  console.log('\n📌 3. Fullscreen Lock Overlay:');
  assert(
    'Exit Assessment button is present in fullscreen enforcement overlay',
    examContent.includes('Exit Assessment') && examContent.includes('stopCameraAndMic()')
  );

  console.log('\n========================================');
  console.log('🏁 All Practice Assessment Close Tests Passed (100%)');
  console.log('========================================\n');
}

verifyExamCloseOption().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
