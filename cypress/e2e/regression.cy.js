// Basic regression smoke covering navigation, role security and JSON response schema
// Note: This Cypress spec assumes you serve this folder at http://localhost:8080

function setSession(win, role='admin'){
  const sess = { id:'U1', email: role==='admin'?'admin@example.com':(role==='ae'?'ae@example.com':'am@example.com'), name:'Test User', role };
  win.localStorage.setItem('ascm_session', JSON.stringify(sess));
}

describe('ASCM App Regression', () => {
  beforeEach(() => {
    // Common stubs so tests don’t depend on live backend
    cy.intercept({ method: 'HEAD', url: /\/tables\/users\?limit=1.*/ }, { statusCode: 200, body: '' });
    cy.intercept('GET', /\/tables\/(users|activities|goals|goal_periods|goal_entries|audit_logs).*$/, (req) => {
      if (/\/tables\/users\/.+/.test(req.url)) return req.reply({ id:'U1', email:'admin@example.com', role:'admin', name:'Admin' });
      return req.reply({ data: [], total: 0, page: 1, limit: 2000 });
    });
  });

  it('SPA shell shows sidebar and loads Home in iframe; KPIs render; admin-only links gated', () => {
    cy.visit('index.html');
    cy.window().then(w => setSession(w,'ae'));
    cy.visit('app.html');
    cy.get('.sidebar').should('exist');
    cy.get('#appFrame').should('have.attr','src').and('include','home.html?embed=1');
    // Sidebar should NOT include Set Goals for non-admins
    cy.contains('.nav .nav-item','Goals Portal').should('not.exist');
    // Inspect content inside iframe for KPI cards
    cy.get('#appFrame').its('0.contentDocument').should('exist');
    cy.get('#appFrame').its('0.contentDocument.body').should('not.be.empty');
    cy.get('#appFrame').then($iframe => {
      const body = $iframe.contents().find('body');
      cy.wrap(body).find('.kpi .value').should('have.length', 4);
    });
    // Switch to admin and verify admin-only links appear without blanking the UI
    cy.window().then(w => setSession(w,'admin'));
    cy.reload();
    cy.contains('.nav .nav-item','Goals Portal').should('exist');
  });

  it('lands on universal Home after login and Home button routes back from analytics', () => {
    cy.visit('index.html');
    cy.window().then(w => setSession(w,'admin'));
    cy.visit('app.html');
    // Navigate to Analytics and back via #home-button
    cy.visit('analytics-dashboard.html');
    cy.get('#home-button').click();
    cy.location('pathname').should('include','app.html');
  });

  it('Goal links visible only for verified admins and portal access gated for non-admins', () => {
    // Admin: Goals Portal link exists in sidebar
    cy.window().then(w => setSession(w,'admin'));
    cy.visit('app.html');
    cy.contains('.nav .nav-item','Goals Portal').should('exist');

    // Non-admin: direct access shows client-side gate
    cy.window().then(w => setSession(w,'ae'));
    cy.visit('goals-portal.html');
    cy.contains('Access denied: Admins only.');
  });

  it('Goals Portal shows JSON confirmations on Save Draft and Publish (snapshot-first)', () => {
    cy.window().then(w => setSession(w,'admin'));
    cy.visit('goals-portal.html');
    cy.get('#saveDraft').click();
    cy.get('pre#jsonResponse').should('contain.text','Goals saved as draft');
    cy.get('#publish').click();
    cy.get('pre#jsonResponse').should('contain.text','Goals published');
  });
});
