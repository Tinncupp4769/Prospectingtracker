// Canonical metrics catalog for AE and AM roles
// Single source of truth to prevent divergence across pages
// Keys are camelCase and match activity fields and goals.metric values

(function(){
  const AE = {
    Activities: [
      ['callsMade','Calls Made','fa-solid fa-phone'],
      ['emailsSent','Emails Sent','fa-solid fa-envelope'],
      ['linkedinMessages','LinkedIn Messages','fa-brands fa-linkedin'],
      ['vidyardVideos','Vidyard Videos','fa-solid fa-video'],
      ['meetingsConducted','Meetings Conducted','fa-solid fa-person-chalkboard'],
      // AE does not include cross/up-sell ABM keys by design (goals scope excludes them for AE)
    ],
    Results: [
      ['meetingsBooked','Meetings Booked','fa-solid fa-calendar-check'],
      ['successfulContacts','Successful Contacts','fa-solid fa-circle-check'],
      ['opportunitiesGenerated','Opportunities Generated','fa-solid fa-lightbulb'],
      ['referralsGenerated','Referrals Generated','fa-solid fa-share-nodes']
    ],
    Financials: [
      ['pipelineGenerated','Total Pipeline Value Generated from Prospecting','fa-solid fa-funnel-dollar'],
      ['revenueClosed','Revenue Closed ($)','fa-solid fa-sack-dollar']
    ]
  };

  const AM = {
    Activities: [
      ['accountsTargeted','Accounts Targeted','fa-solid fa-bullseye'],
      ['callsMade','Calls Made','fa-solid fa-phone'],
      ['emailsSent','Emails Sent','fa-solid fa-envelope'],
      ['linkedinMessages','LinkedIn Messages','fa-brands fa-linkedin'],
      ['vidyardVideos','Vidyard Videos','fa-solid fa-video'],
      ['meetingsConducted','Meetings Conducted','fa-solid fa-person-chalkboard'],
      // AE does not include cross/up-sell ABM keys by design (goals scope excludes them for AE)
    ],
    Results: [
      ['meetingsBooked','Meetings Booked','fa-solid fa-calendar-check'],
      ['successfulContacts','Successful Contacts','fa-solid fa-circle-check'],
      ['opportunitiesGenerated','Opportunities Generated','fa-solid fa-lightbulb'],
      ['referralsGenerated','Referrals Generated','fa-solid fa-share-nodes']
    ],
    Financials: [
      ['pipelineGenerated','Total Pipeline Value Generated from Prospecting','fa-solid fa-funnel-dollar'],
      ['revenueClosed','Revenue Closed ($)','fa-solid fa-sack-dollar']
    ],
    ABM: [
      ['generalAbmCampaigns','General ABM','fa-solid fa-bullhorn'],
      ['crossSellAbmCampaigns','Cross-Sell ABM','fa-solid fa-bullhorn'],
      ['upSellAbmCampaigns','Up-Sell ABM','fa-solid fa-bullhorn'],
      ['dormantAbmCampaigns','Dormant ABM','fa-solid fa-bullhorn']
    ]
  };

  const METRICS_CATALOG = { ae: AE, am: AM };
  // Order helper for goal-setting UI (includes AM ABM cross/up-sell ahead of Dormant)
  try { window.METRICS_ORDER = [
    'callsMade','emailsSent','meetingsConducted','meetingsBooked','opportunitiesGenerated','vidyardVideos','linkedinMessages',
    'pipelineGenerated','revenueClosed','accountsTargeted','generalAbmCampaigns','crossSellAbmCampaigns','upSellAbmCampaigns','dormantAbmCampaigns','referralsGenerated','successfulContacts'
  ]; } catch{}

  try { window.METRICS_CATALOG = METRICS_CATALOG; } catch {}
})();
