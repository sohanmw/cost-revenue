var EMAIL = 'you@example.com';
var START_DATE = '2024-01-01';
var END_DATE = '2024-01-31';

// Google Sheet details used to filter which accounts the script runs on.
var SPREADSHEET_ID = '1Q3oZPHT6XA2J4QHg-H239DSrXKEGKCktzHozd99RpNg';
var SHEET_NAME = 'PM&CID';
var TARGET_COUNTRY = 'Sri Lanka';

function main() {
  var totals = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    conversionValue: 0,
    allConversions: 0,
    allConversionValue: 0
  };
  var rows = [];
  // Retrieve the list of CIDs whose country in column O is "Sri Lanka".
  var allowedCids = getCidsForCountry(TARGET_COUNTRY);
  var accountIter = MccApp.accounts().withIds(allowedCids).get();
  while (accountIter.hasNext()) {
    var account = accountIter.next();
    MccApp.select(account);
    var stats = getStats(START_DATE, END_DATE);
    stats.accountName = account.getName();
    stats.cid = account.getCustomerId();
    rows.push(stats);
    totals.impressions += stats.impressions;
    totals.clicks += stats.clicks;
    totals.cost += stats.cost;
    totals.conversions += stats.conversions;
    totals.conversionValue += stats.conversionValue;
    totals.allConversions += stats.allConversions;
    totals.allConversionValue += stats.allConversionValue;
  }
  var body = buildEmailBody(totals, rows);
  MailApp.sendEmail({
    to: EMAIL,
    subject: 'MCC Performance ' + START_DATE + ' - ' + END_DATE,
    body: 'See HTML version',
    htmlBody: body
  });
}

// Reads the configured Google Sheet and returns the CIDs for the given country.
function getCidsForCountry(country) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  var data = sheet.getRange('A:O').getValues();
  var ids = [];
  for (var i = 0; i < data.length; i++) {
    var cid = data[i][0];      // Column A
    var rowCountry = data[i][14]; // Column O
    if (rowCountry === country && cid) {
      ids.push(cid.toString());
    }
  }
  return ids;
}

function getStats(startDate, endDate) {
  var formattedStart = startDate.replace(/-/g, '');
  var formattedEnd = endDate.replace(/-/g, '');
  var query = 'SELECT Impressions, Clicks, Cost, Conversions, ConversionValue, AllConversions, AllConversionValue ' +
              'FROM ACCOUNT_PERFORMANCE_REPORT ' +
              'DURING ' + formattedStart + ',' + formattedEnd;
  var report = AdsApp.report(query);
  var rowIter = report.rows();
  if (!rowIter.hasNext()) {
    return {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      conversionValue: 0,
      allConversions: 0,
      allConversionValue: 0
    };
  }
  var row = rowIter.next();
  return {
    impressions: parseInt(row.Impressions.replace(/,/g, ''), 10),
    clicks: parseInt(row.Clicks.replace(/,/g, ''), 10),
    cost: parseFloat(row.Cost.replace(/,/g, '')) / 1000000,
    conversions: parseFloat(row.Conversions.replace(/,/g, '')),
    conversionValue: parseFloat(row.ConversionValue.replace(/,/g, '')),
    allConversions: parseFloat(row.AllConversions.replace(/,/g, '')),
    allConversionValue: parseFloat(row.AllConversionValue.replace(/,/g, ''))
  };
}

function formatInteger(num) {
  return Math.round(num).toLocaleString('en-US');
}

function formatDecimal(num) {
  return num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function buildEmailBody(totals, rows) {
  var body = '';
  body += '<p>Date Range: ' + START_DATE + ' to ' + END_DATE + '</p>';
  body += '<h2>Scorecard</h2>';
  body += '<table border="1" cellpadding="5" cellspacing="0">';
  body += '<tr><th>Impressions</th><th>Clicks</th><th>Cost</th><th>Conversions</th><th>Conversion Value</th><th>All Conversions</th><th>All Conversion Value</th></tr>';
  body += '<tr>' +
          '<td>' + formatInteger(totals.impressions) + '</td>' +
          '<td>' + formatInteger(totals.clicks) + '</td>' +
          '<td>' + formatDecimal(totals.cost) + '</td>' +
          '<td>' + formatDecimal(totals.conversions) + '</td>' +
          '<td>' + formatDecimal(totals.conversionValue) + '</td>' +
          '<td>' + formatDecimal(totals.allConversions) + '</td>' +
          '<td>' + formatDecimal(totals.allConversionValue) + '</td>' +
          '</tr>';
  body += '</table>';
  body += '<h2>By Account</h2>';
  body += '<table border="1" cellpadding="5" cellspacing="0">';
  body += '<tr><th>CID</th><th>Account</th><th>Impressions</th><th>Clicks</th><th>Cost</th><th>Conversions</th><th>Conv. Value</th><th>All Conv.</th><th>All Conv. Value</th></tr>';
  rows.forEach(function(r) {
    body += '<tr>' +
            '<td>' + r.cid + '</td>' +
            '<td>' + r.accountName + '</td>' +
            '<td>' + formatInteger(r.impressions) + '</td>' +
            '<td>' + formatInteger(r.clicks) + '</td>' +
            '<td>' + formatDecimal(r.cost) + '</td>' +
            '<td>' + formatDecimal(r.conversions) + '</td>' +
            '<td>' + formatDecimal(r.conversionValue) + '</td>' +
            '<td>' + formatDecimal(r.allConversions) + '</td>' +
            '<td>' + formatDecimal(r.allConversionValue) + '</td>' +
            '</tr>';
  });
  body += '</table>';
  return body;
}
