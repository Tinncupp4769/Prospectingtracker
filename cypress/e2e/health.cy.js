// Health check E2E: Covers pages, API probing, RBAC, flows

function setSession(win, role='admin'){
  const sess = { id:'U1', email: role==='admin'?'admin@example.com':(role==='ae'?'ae@example.com':'am@example.com'), name:'Test User', role };
  win.localStorage.setItem('ascm_session', JSON.stringify(sess));
}

describe('ASCM Health Check', () => {
  it('runs embedded health probes', () => {
    // Stub API base detection and common endpoints so CI doesn’t depend on a live backend
    cy.intercept({ method: 'HEAD', url: /\/tables\/users\?limit=1.*/ }, { statusCode: 200, body: '' });
    cy.intercept('GET', /\/tables\/(users|activities|goals|audit_logs).*$/, (req) => {
      if (/\/tables\/users\/.+/.test(req.url)) return req.reply({ id:'U1', email:'admin@example.com', role:'admin', name:'Admin' });
      return req.reply({ data: [], total: 0, page: 1, limit: 100 });
    });
    cy.visit('tests/health.html');
    cy.window().then(w => setSession(w,'admin'));
    cy.get('#runBtn').click();
    cy.get('#status').contains('done', { timeout: 60000 });
    // Persist health JSON for CI artifact/debug
    cy.window().its('HEALTH_RESULT').then(r => {
      cy.writeFile('tests/report/last-health.json', r);
    });
    cy.get('#summary').should('contain.text','checks passed');
    cy.window().its('HEALTH_RESULT').then(r => {
      expect(r).to.have.property('results');
      // Ensure at least one API and one PAGE check ran
      expect(r.results.some(x=>x.type==='api')).to.be.true;
      expect(r.results.some(x=>x.type==='page')).to.be.true;
    });
  });

  it('admin RBAC gating for goals-portal', () => {
    cy.window().then(w => setSession(w,'ae'));
    cy.visit('goals-portal.html');
    cy.contains('Access denied: Admins only.');

    cy.window().then(w => setSession(w,'admin'));
    cy.visit('goals-portal.html');
    cy.get('#saveDraft').should('exist');
  });

  it('AE and AM entry pages load and allow interaction of numeric fields', () => {
    cy.window().then(w => setSession(w,'ae'));
    cy.visit('activity-entry-ae.html');
    cy.get('input[type="number"]').first().type('{selectall}3');

    cy.window().then(w => setSession(w,'am'));
    cy.visit('activity-entry-am.html');
    cy.get('input[type="number"]').first().type('{selectall}4');
  });

  it('Home navigation tiles route without blank screen', () => {
    cy.window().then(w => setSession(w,'admin'));
    cy.visit('app.html');
    cy.contains('Enter Activity');
    cy.get('.grid .card').its('length').should('be.greaterThan', 2);
  });
});
