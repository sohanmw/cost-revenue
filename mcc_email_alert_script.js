var EMAIL = 'you@example.com';
var START_DATE = '2024-01-01';
var END_DATE = '2024-01-31';

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
  var accountIter = MccApp.accounts().get();
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
  MailApp.sendEmail(EMAIL, 'MCC Performance ' + START_DATE + ' - ' + END_DATE, body);
}

function getStats(startDate, endDate) {
  var query = 'SELECT Impressions, Clicks, Cost, Conversions, ConversionValue, AllConversions, AllConversionValue ' +
              'FROM ACCOUNT_PERFORMANCE_REPORT ' +
              'DURING ' + startDate + ',' + endDate;
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
    impressions: parseInt(row.Impressions, 10),
    clicks: parseInt(row.Clicks, 10),
    cost: parseFloat(row.Cost) / 1000000,
    conversions: parseFloat(row.Conversions),
    conversionValue: parseFloat(row.ConversionValue),
    allConversions: parseFloat(row.AllConversions),
    allConversionValue: parseFloat(row.AllConversionValue)
  };
}

function buildEmailBody(totals, rows) {
  var body = '';
  body += 'Date Range: ' + START_DATE + ' to ' + END_DATE + '\n\n';
  body += 'Scorecard\n';
  body += 'Impressions: ' + totals.impressions + '\n';
  body += 'Clicks: ' + totals.clicks + '\n';
  body += 'Cost: ' + totals.cost.toFixed(2) + '\n';
  body += 'Conversions: ' + totals.conversions + '\n';
  body += 'Conversion Value: ' + totals.conversionValue.toFixed(2) + '\n';
  body += 'All Conversions: ' + totals.allConversions + '\n';
  body += 'All Conversion Value: ' + totals.allConversionValue.toFixed(2) + '\n\n';
  body += 'By Account\n';
  body += 'CID\tAccount\tImpressions\tClicks\tCost\tConversions\tConv. Value\tAll Conv.\tAll Conv. Value\n';
  rows.forEach(function(r) {
    body += [
      r.cid,
      r.accountName,
      r.impressions,
      r.clicks,
      r.cost.toFixed(2),
      r.conversions,
      r.conversionValue.toFixed(2),
      r.allConversions,
      r.allConversionValue.toFixed(2)
    ].join('\t') + '\n';
  });
  return body;
}
