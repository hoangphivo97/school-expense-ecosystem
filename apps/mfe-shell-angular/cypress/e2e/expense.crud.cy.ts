describe('Expense', () => {
  before(() => {
    cy.session('qa-user-001', () => {
      cy.task<string>('mintCustomToken', 'qa-user-001').then((token) => {
        cy.visit('/'); //Root open

        //Sign In with custom token in browser
        cy.window().then(async () => {
          const {
            getAuth,
            setPersistence,
            browserLocalPersistence,
            signInWithCustomToken,
          } = await import('firebase/auth');
          const { getApp, initializeApp, getApps } = await import(
            'firebase/app'
          );
          const { firebaseConfig } = await import(
            '../../src/app/environments/environment'
          );

          const app = getApps().length
            ? getApp()
            : initializeApp({
                ...firebaseConfig,
              });
          const auth = getAuth(app);
          await setPersistence(auth, browserLocalPersistence);
          await signInWithCustomToken(auth, token);
        });
      });
    });
  });
  beforeEach(() => {
    cy.visit('/expenses');
    cy.contains('Expenses').should('be.visible');
  });

  it('open create modal', () => {
    cy.get('[data-testid="open-create-modal-btn"]').click();
    cy.get('mat-dialog-container').should('be.visible');
  });

  it('create expense', () => {
    cy.get('[data-testid="open-create-modal-btn"]').click();
    cy.get('mat-dialog-container').should('be.visible');

    //open datepicker
    cy.get('[data-testid="expense-date-toggle"]').click();
    cy.get('.mat-datepicker-content').should('be.visible');

    //input date
    cy.get(
      '.cdk-overlay-container .mat-calendar-body-cell:not(.mat-calendar-body-disabled) .mat-calendar-body-cell-content',
    )
      .contains(/^11$/)
      .click();
    cy.get('[data-testid="expense-date-input"]')
      .invoke('val')
      .should('match', /\d{2}\/\d{2}\/\d{4}/);
  });
});
