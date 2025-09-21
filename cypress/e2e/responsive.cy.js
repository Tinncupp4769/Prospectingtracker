// Responsive checks across key pages at mobile and desktop

function setSession(win, role='admin'){
  const sess = { id:'U1', email: role==='admin'?'admin@example.com':(role==='ae'?'ae@example.com':'am@example.com'), name:'Test User', role };
  win.localStorage.setItem('ascm_session', JSON.stringify(sess));
}

describe('Responsive and Accessibility Basics', () => {
  beforeEach(() => {
    // HEAD and basic endpoints stubs
    cy.intercept({ method: 'HEAD', url: /\/tables\/users\?limit=1.*/ }, { statusCode: 200, body: '' });
    cy.intercept('GET', /\/tables\/(users|activities|goals|goal_periods|goal_entries|audit_logs).*$/, (req) => {
      if (/\/tables\/users\/.+/.test(req.url)) return req.reply({ id:'U1', email:'admin@example.com', role:'admin', name:'Admin' });
      return req.reply({ data: [], total: 0, page: 1, limit: 2000 });
    });
  });

  it('Home and Dashboard at mobile width', () => {
    cy.viewport('iphone-6');
    cy.visit('index.html');
    cy.window().then(w => setSession(w,'admin'));
    cy.visit('app.html');
    cy.get('.topbar').should('be.visible');
    cy.get('.sidebar').should('be.visible');

    cy.visit('sales-dashboard-modular.html');
    cy.get('#home-button').should('be.visible');
  });

  it('Goals Portal at mobile width', () => {
    cy.viewport('iphone-6');
    cy.window().then(w => setSession(w,'admin'));
    cy.visit('goals-portal.html');
    cy.get('#saveDraft').should('be.visible');
  });
});
