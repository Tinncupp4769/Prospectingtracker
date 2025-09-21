// RBAC and permissions boundary tests

function setSession(win, role='admin'){
  const sess = { id:'U1', email: role==='admin'?'admin@example.com':(role==='ae'?'ae@example.com':'am@example.com'), name:'Test User', role };
  win.localStorage.setItem('ascm_session', JSON.stringify(sess));
}

describe('RBAC Gates', () => {
  it('blocks non-admin from Goals Portal', () => {
    cy.window().then(w => setSession(w,'ae'));
    cy.visit('goals-portal.html');
    cy.contains('Access denied: Admins only.');
  });

  it('allows admin into all admin consoles', () => {
    cy.window().then(w => setSession(w,'admin'));
    cy.visit('admin-users.html');
    cy.get('#home-button').should('exist');
    cy.visit('admin-weights.html');
    cy.get('#home-button').should('exist');
    cy.visit('goals-portal.html');
    cy.get('#saveDraft').should('exist');
  });
});
