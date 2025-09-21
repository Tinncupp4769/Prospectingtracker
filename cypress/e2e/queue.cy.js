// Queue fallback test: simulate WAF/403 to ensure publish enqueues and UI reflects queued state

function setSession(win){
  const sess = { id:'U1', email:'admin@example.com', name:'Admin', role:'admin' };
  win.localStorage.setItem('ascm_session', JSON.stringify(sess));
}

describe('Goals Queue Fallback', () => {
  it('publishing with 403 enqueues items and shows queued message', () => {
    cy.visit('goals-portal.html');
    cy.window().then(w => setSession(w));

    // Type a small value in the first numeric field once the grid renders
    cy.get('input[inputmode="numeric"]').first().type('{selectall}2');

    // Intercept POST/PATCH to tables/goals and force 403
    cy.intercept('POST', /\/tables\/goals(\?.*)?$/, { statusCode: 403, body: { error:'forbidden' } });
    cy.intercept('PATCH', /\/tables\/goals\/.+$/, { statusCode: 403, body: { error:'forbidden' } });

    // Attempt publish
    cy.get('#publish').click();

    // JSON confirmation should show publish success and queue chip should reflect queued legacy sync
    cy.get('pre#jsonResponse', { timeout: 20000 }).should('contain.text','Goals published');
    cy.get('#queueChip', { timeout: 20000 }).should('contain.text','Q:').and($el=>{
      expect($el.text().trim()).not.to.eq('Q: 0');
    });
  });
});
