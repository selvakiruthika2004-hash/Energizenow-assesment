// Transparent Rule-Based Engine
const analyzeComplaint = (subject, description, category) => {
  const text = (subject + ' ' + description).toLowerCase();
  let sentiment = 'NEUTRAL';
  let priority = 'LOW';
  let riskScore = 10;
  
  if (text.includes('angry') || text.includes('unacceptable') || text.includes('failed') || text.includes('worst')) {
    sentiment = 'NEGATIVE';
  }
  if (text.includes('urgent') || text.includes('outage') || text.includes('security') || text.includes('breach')) {
    priority = 'CRITICAL';
    sentiment = 'HIGHLY_NEGATIVE';
    riskScore = 85;
  } else if (text.includes('important') || text.includes('business') || text.includes('down')) {
    priority = 'HIGH';
    riskScore = 60;
  } else if (text.includes('normal') || text.includes('issue')) {
    priority = 'MEDIUM';
    riskScore = 30;
  }

  return { sentiment, priority, riskScore };
};

module.exports = { analyzeComplaint };