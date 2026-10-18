'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {execFileSync,spawnSync} = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const {
  MASTER_HEADERS, sheetDate, lifecycle, safeRoute, assertMasterHeaders,
  sourceRows, summarize
} = require('../lib/crm-dashboard-v2');
const fixturePath=path.join(__dirname,'fixtures/crm-dashboard-v2.synthetic.json');
const fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
const base=()=>summarize(fixture,'2026-10-18');

test('46 positional headers: exactly A:AT and fail closed on reorder', () => {
  assert.equal(MASTER_HEADERS.length, 46);
  assert.equal(MASTER_HEADERS[0], 'record_id');
  assert.equal(MASTER_HEADERS[45], 'dedupe_key');
  assertMasterHeaders(MASTER_HEADERS);
  const bad=[...MASTER_HEADERS];[bad[3],bad[4]]=[bad[4],bad[3]];
  assert.throws(()=>assertMasterHeaders(bad),/CRM_HEADER_CONTRACT_MISMATCH/);
});
test('mixed ISO, offset, US locale, Sheets numeric serial and invalid dates',()=>{
  assert.equal(sheetDate('2026-10-17T23:00:00-04:00'),'2026-10-17');
  assert.equal(sheetDate('2026-09-02 16:30:00'),'2026-09-02');
  assert.equal(sheetDate('10/18/2026'),'2026-10-18');
  assert.equal(sheetDate(0),'1899-12-30');
  assert.equal(sheetDate(1),'1899-12-31');
  assert.equal(sheetDate(46094.5),'2026-03-13');
  assert.equal(sheetDate('2026-02-30'),null);
  assert.equal(sheetDate('09/31/2026'),null);
  assert.equal(sheetDate('20/11/2026'),null);
  assert.equal(sheetDate('unknown'),null);
});
test('lifecycle keeps blank status under review; unknown is recorded nonterminal',()=>{
  assert.equal(lifecycle(''),'Needs status review');
  assert.equal(lifecycle('Closed Lost'),'Terminal');
  assert.equal(lifecycle('Funded'),'Terminal');
  assert.equal(lifecycle('Unknown'),'Nonterminal');
});
test('fixture yields deterministic disjoint lifecycle buckets and actionable metrics',()=>{
  const x=base();
  assert.equal(x.source_row_count,12);
  assert.deepEqual(x.lifecycle,{closed_lost:2,recorded_won_or_funded:2,nonterminal:7,status_review:1});
  assert.equal(x.lifecycle.closed_lost+x.lifecycle.recorded_won_or_funded+x.lifecycle.nonterminal+x.lifecycle.status_review,12);
  assert.equal(x.operations.follow_up_past_due_nonterminal_or_unclassified,3);
  assert.equal(x.operations.follow_up_due_today_nonterminal_or_unclassified,1);
  assert.equal(x.operations.terminal_rows_with_follow_up_dates,1);
  assert.equal(x.operations.bank_connection_pending_all,1);
  assert.equal(x.operations.documents_requested_all,1);
  assert.equal(x.operations.documents_missing_all,1);
  assert.equal(x.operations.invalid_follow_up_dates,1);
  assert.equal(x.operations.invalid_created_dates,1);
  assert.equal(x.quality.missing_status,1);
  assert.equal(x.quality.unknown_status,1);
  assert.equal(x.quality.stage_status_disagreements,1);
  assert.equal(x.quality.duplicate_record_id_groups,1);
});
test('source route and funding product remain distinct; labels cannot leak unsanitized',()=>{
  assert.equal(safeRoute('GoKapital Test'),'Other / unclassified');
  const x=base();
  assert.equal(x.source_route_counts.DAC,3);
  assert.equal(x.source_route_counts.BankBreezy,2);
  assert.equal(x.source_route_counts['Other / unclassified'],1);
  assert.ok(!JSON.stringify(x).includes('GoKapital Test'));
  assert.ok(!JSON.stringify(x).includes('Equipment Finance'));
});
test('empty filter/empty values produce safe empty aggregate',()=>{
  const x=summarize({values:[MASTER_HEADERS]},'2026-10-18');
  assert.equal(x.source_row_count,0);
  assert.equal(x.lifecycle.status_review,0);
  assert.equal(x.operations.follow_up_past_due_nonterminal_or_unclassified,0);
});
test('Sheets values matrix and synthetic object fixture give identical metrics',()=>{
  const values=[MASTER_HEADERS,...fixture.rows.map(row=>MASTER_HEADERS.map(name=>row[name]??''))];
  assert.deepEqual(summarize({values},'2026-10-18'),base());
});
test('blank record id is counted, repeated email is not a record identity',()=>{
  const x=summarize({rows:[{record_id:'',status:'New',email:'same@test.invalid'},
    {record_id:'CASE-A',email:'same@test.invalid',status:'Closed Lost'},
    {record_id:'CASE-B',email:'same@test.invalid',status:'New'}]},'2026-10-18');
  assert.equal(x.source_row_count,3);
  assert.equal(x.quality.missing_record_id,1);
  assert.equal(x.quality.duplicate_record_id_groups,0);
});
test('offline report prints aggregate JSON but never synthetic applicant/source free text',()=>{
  const cli=path.resolve(__dirname,'../scripts/crm-dashboard-v2-report.js');
  const text=execFileSync(process.execPath,[cli,'--input',fixturePath,'--business-date','2026-10-18'],{encoding:'utf8'});
  const result=JSON.parse(text);
  assert.equal(result.source_row_count,12);
  for(const token of ['SYN-01','SYN-12','GoKapital Test','Equipment Finance']){
    assert.ok(!text.includes(token));
  }
});
test('offline report errors do not echo paths or input values',()=>{
  const cli=path.resolve(__dirname,'../scripts/crm-dashboard-v2-report.js');
  const r=spawnSync(process.execPath,[cli,'--input','/nonexistent/secret-applicant-name.json','--business-date','2026-10-18'],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.equal(r.stderr.trim(),'CRM_REPORT_FAILED');
  assert.ok(!r.stderr.includes('secret-applicant'));
});
test('source date cutoff required; never defaults to UTC TODAY()',()=>{
  assert.throws(()=>summarize(fixture),/CRM_BUSINESS_DATE_REQUIRED/);
  assert.throws(()=>summarize(fixture,'2026-02-30'),/CRM_BUSINESS_DATE_REQUIRED/);
});