/**  PP Questions Log — Google Apps Script (deploy as Web App, "Anyone", execute as you)
 *   1. Create a Google Sheet named "PP Questions Log". Extensions → Apps Script → paste this file.
 *   2. Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → Deploy.
 *   3. Copy the /exec URL into Vercel as PP_LOG_URL, and set PP_LOG_KEY to any secret (default below is "pp-log").
 *   The sheet fills one row per question. You (admin) just open the sheet.
 */
var KEY = 'pp-log';
var HEAD = ['when_ist','household','user','question','kind','matched_skus','answer_excerpt','used_model','build'];
function sheet_(){var ss=SpreadsheetApp.getActiveSpreadsheet();var sh=ss.getSheetByName('Questions')||ss.insertSheet('Questions');
  if(sh.getLastRow()===0){sh.appendRow(HEAD);sh.setFrozenRows(1);sh.getRange(1,1,1,HEAD.length).setFontWeight('bold');}return sh;}
function doPost(e){try{var b=JSON.parse(e.postData.contents||'{}');if(b.key!==KEY)return out_({ok:false,error:'bad key'});
  var sh=sheet_();var when=Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd HH:mm:ss');
  sh.appendRow([when,b.household||'',b.user||'',String(b.question||'').slice(0,2000),b.kind||'',String(b.matched||'').slice(0,500),String(b.answer||'').slice(0,1500),b.used_model?'yes':'no',b.build||'']);
  return out_({ok:true});}catch(err){return out_({ok:false,error:String(err)});}}
function doGet(e){var p=e.parameter||{};if(p.key!==KEY)return out_({ok:false,error:'bad key'});
  var sh=sheet_();var n=Math.min(500,Math.max(1,+p.n||100));var last=sh.getLastRow();if(last<2)return out_({ok:true,rows:[]});
  var start=Math.max(2,last-n+1);var vals=sh.getRange(start,1,last-start+1,HEAD.length).getValues();
  var rows=vals.map(function(r){var o={};HEAD.forEach(function(h,i){o[h]=r[i];});return o;}).reverse();
  if(p.household)rows=rows.filter(function(r){return r.household===p.household;});
  return out_({ok:true,rows:rows});}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
