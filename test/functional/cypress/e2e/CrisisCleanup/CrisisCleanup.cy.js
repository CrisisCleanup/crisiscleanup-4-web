// /// <reference types ='cypress' />
import 'cypress-file-upload';

describe('Crisis Cleanup Home Pages Validation', () => {

    sessionStorage.clear()

    beforeEach(function() {
      cy.visit('https://app.staging.crisiscleanup.io/login?from=/', { timeout: 500000 }, {failOnStatusCode: false});    
    })
    /*
      // Validate About Us
        it('Validate About Us', () => {
         cy.get('.grid--nav > :nth-child(2) > .font-h1').click()
         cy.get('.grid--main > :nth-child(1) > .text-4xl').then($about => {
          const aboutText = $about.text()
          cy.log(aboutText)
          cy.get('.grid--main > :nth-child(1) > .text-4xl').should('have.text', aboutText)
         })
        })  
      
    //API unable to fetch, captcha needs to get disabled on the server this website is deployed on from dev's end for testing purposes    
         it('Validate Contacts', () => {
      // 1st way
          cy.get(':nth-child(7) > .font-h1').invoke('removeAttr', 'target').click()
          cy.wait(60000)
          cy.get('.page-header').then($title1 => {
          const titleText = $title1.text()
          cy.log(titleText)
          cy.url().should('include', 'blog')
          cy.get('.page-header').should('have.text', titleText)
          })
          cy.go('back')

      // 2nd way
          cy.get(':nth-child(7) > .font-h1').then(newTab => {
            const hrefTab = newTab.prop('href')
            cy.visit(hrefTab, { timeout: 500000 }, {failOnStatusCode: false})
            cy.url().should('include', '/requests')

            cy.get('.page-header').then($title1 => {
              const titleText = $title1.text()
              cy.log(titleText)
              cy.get('.page-header').should('have.text', titleText)
              })

          })
        
         }) 
    
    // Blogs Page is not secured, cypress doesn't handles unsecured pages
       it('Validate Blogs', () => {
        
      // 1st way
           cy.get(':nth-child(3) > .font-h1').invoke('removeAttr', 'target').click()
           cy.wait(60000)
           cy.get('h1[title="Crisis Cleanup"]').then($title1 => {
            const titleText = $title1.text()
            cy.log(titleText)
            cy.url().should('include', 'blog')
            cy.get('[title="Crisis Cleanup"]').should('have.text', titleText)
            })
    
      // 2nd way
          cy.get(':nth-child(3) > .font-h1').then(newTab => {
            const hrefTab = newTab.prop('href')
            cy.visit(hrefTab, { timeout: 500000 }, {failOnStatusCode: false})
            cy.url().should('include', 'blog')

            cy.get('h1[title="Crisis Cleanup"]').then($title1 => {
              const titleText = $title1.text()
              cy.log(titleText)
              cy.get('[title="Crisis Cleanup"]').should('have.text', titleText)
              })

          }) 
        
         })  */
    
 /*     // Validate Map
        it('Validate Map', () => {
         cy.get(':nth-child(4) > .font-h1').click()
         cy.wait(5000)
         cy.get('.text-4xl').then($map => {
          const mapText = $map.text()
          cy.log(mapText)
          cy.get('.text-4xl').should('have.text', mapText)
         })
        }) 
      // Validate Training
        it('Validate Training', () => {
         cy.get(':nth-child(5) > .font-h1').click()
         cy.wait(5000)
         cy.get('.text-5xl').then($train => {
          const training = $train.text()
          cy.log(training)
          cy.get('.text-5xl').should('have.text', training)
         })
        }) 

      // Validate Survivor
        it('Validate Survivor', () => {
         cy.get(':nth-child(6) > .font-h1').click()
         cy.wait(5000)
         cy.get('.text-4xl').then($surv => {
         const surv1 = $surv.text()
         cy.log(surv1)
         cy.get('.text-4xl').should('have.text', surv1)
         })
        })  

      // Validate Register Page
        it('Validate Register page', () => {
          cy.get('div[class="grid--actions mb-4 flex flex-col w-full"] button[title="button"]').click()
          cy.get('.text-4xl').then($registerText => {
            const regisHeader = $registerText.text()
            cy.log(regisHeader)
          cy.get('.text-4xl').should('have.text', regisHeader)
          }) 
        })  */

 /*     // Validate AWS
         it('Validate Powered by AWS', () => {
          // cy.xpatch('//a[@class="w-40 block md:self-end mt-3"]//img').invoke('removeAttr', 'target').click()
          // cy.get('#AWS_Disaster_Response').should('have.text', ' AWS Disaster Response')
      // 2nd Way    
           cy.xpatch('//a[@class="w-40 block md:self-end mt-3"]//img').invoke('removeAttr', 'target').click()
           cy.xpatch('//a[@class="w-40 block md:self-end mt-3"]//img').then(newTab => {
            const hrefTab = newTab.prop('href')
            cy.visit(hrefTab, { timeout: 500000 }, {failOnStatusCode: false})
            cy.url().should('include', '/requests')

            cy.get('#AWS_Disaster_Response').then($title1 => {
              const titleText = $title1.text()
              cy.log(titleText)
            cy.get('#AWS_Disaster_Response').should('have.text', titleText)
              })
          })
         }) */
/*
      // Validate Home Page
        it('Validate Home Page', () => {
         cy.get('.router-link-active').click()
         cy.get('.grid--title > .text-h1').then($lText => {
          const pText = $lText.text()
          cy.log(pText)
         cy.get('.grid--title > .text-h1').should('have.text', pText) 

        })    
        }) */
        })  

       describe('Crisis Cleanup Dashboard, Invite, Edit Profile', () => {
        beforeEach(function() {
        cy.visit('https://app.staging.crisiscleanup.io/login?from=/', /*{ timeout: 1000000 },*/ {failOnStatusCode: false});
        cy.url().should('include', 'crisiscleanup.io') 
        cy.get('[type="email"]').should('be.visible').should('be.enabled').type('waqaszafar59@gmail.com')
        cy.get('[type="password"]').should('be.visible').should('be.enabled').type('qwertY12#')
        cy.get('[data-cy="loginForm.login"]').should('be.visible').click()
        cy.wait(10000)
     
     })
/*
        it('Validate Select Incident, and the incident name should appear on the Dashboard.', () => {
         cy.get('.grid > :nth-child(1) > .h-full').then($cardText => {
           const textIncident0 = $cardText.text()
           cy.log(textIncident0)
         cy.get('.grid > :nth-child(1) > .h-full').should('have.text', textIncident0)
     })
    // Will Select 2nd Value
          cy.get('.flex-col > :nth-child(1) > .leading-snug > .relative').click();
          cy.get('#multiselect-option-271 > span').click();
          cy.wait(5000)
          cy.get('.grid > :nth-child(1) > .h-full').then($textCard => {
           const textIncident1 = $textCard.text()
           cy.log(textIncident1)
          cy.get('.grid > :nth-child(1) > .h-full').should('have.text', textIncident1) 
          })
          cy.go('back')
        })  

        it('Validate the functionality of send invite', () => {
           
          cy.get('[data-cy="js-invite-teammates"]').click()
          cy.wait(8000)
      // This Function will Generate the UserName
          function generateNewUsername() {
            let text = "";
            let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            
            for (let i = 0; i < 10; i++)
            text += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
            return text;  
          }
            const generatedUsername = generateNewUsername()
            cy.get('.ti-input').type(generatedUsername + '@example.com')
            cy.get('[data-cy="js-send-invites"]').click().wait(7000)

            cy.get('.Vue-Toastification__toast').should('be.visible')
            cy.get('.Vue-Toastification__toast-body').then($inviteTeam => {
              const inviteToast = $inviteTeam.text()
              cy.log(inviteToast)
            cy.get('.Vue-Toastification__toast-body').should('have.text', inviteToast)
            })
            cy.get('[data-cy="navigation.my_organization"] > .flex-col').click()
            cy.get('.body > :nth-child(1) > :nth-child(1)').should('have.text', generatedUsername + '@example.com') 
        })   */
            
        it('Validate the functionality of Edit Profile', () => {
             
            cy.get('.text-crisiscleanup-dark-500 > .font-h3').click()
            cy.get('[data-cy="auth.userprofile.profile"]').click()
            cy.get('.file-input').attachFile('test1.jpg')
            cy.get(':nth-child(1) > .mr-2 > .flex > [data-cy]').type('{selectall}{backspace}').type('QA');
            cy.get(':nth-child(2) > .mr-2 > .flex > [data-cy]').type('{selectall}{backspace}').type('Testing');
            cy.get('.multiselect-tags-search').type('{selectall}{backspace}').type('Phone Agent').type('{enter}')
            cy.get(':nth-child(5) > [data-v-370675be=""] > .border > .relative > .multiselect-tags > .multiselect-tags-search-wrapper').click()
            cy.get(':nth-child(5) > [data-v-370675be=""] > .border > .relative > .multiselect-tags > .multiselect-tags-search-wrapper').type('{backspace}');
            cy.get(':nth-child(5) > [data-v-370675be=""] > .border > .relative > .multiselect-tags > .multiselect-tags-search-wrapper').click()
            cy.get('#multiselect-option-2 > span').click();
            cy.get('.user-details > :nth-child(1) > :nth-child(2) > .flex > [data-cy]').type('{selectall}{backspace}').type('1 (234) 567-8901')
            cy.get(':nth-child(2) > :nth-child(2) > .flex > [data-cy]').type('{selectall}{backspace}').type('demo@crisiscleanup.org')
                
            cy.get('.mt-3 > :nth-child(2) > .justify-start > [data-cy]').type('https://www.linkedin.com/in/test-three-494556256/')
            cy.get('[data-cy="js-save"]').click()
                 
            cy.get('.Vue-Toastification__toast-body').invoke('text').then((resp1) =>{
                expect(resp1).to.equal('Successfully Saved User!')
            })
            cy.get('.Vue-Toastification__toast-body').then($toastBody => {
                const toastMsg = $toastBody.text()
                cy.log(toastMsg)  
            })                   
          }) 
       })