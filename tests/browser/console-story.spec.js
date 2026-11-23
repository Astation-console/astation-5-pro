import {test,expect} from '@playwright/test';

test('ASTATION console boots, launches new Dreambound, shows story and returns without resetting OS',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const seed={name:'PIX Test User',lang:'pl',installed:['world'],selected:'world',downloads:[],seen:['world'],history:[],trophies:{},stats:{world:{played:0,progress:0,level:1}},recent:[],notifications:[],versions:{},libraryMigrationV11:true,ultimateMigration2:true,gameRevolutionMigration4:true,avatar:0,theme:'midnight',volume:25,musicEnabled:false,touchShown:true};
    localStorage.setItem('astation_pro_v2',JSON.stringify(seed));
  });
  await page.goto('/astation-5-pro/');
  await page.locator('#power-button').click();
  await expect(page.locator('#choose')).toHaveClass(/active/,{timeout:12000});
  await page.locator('#enter-profile').click();
  await expect(page.locator('#console')).toHaveClass(/active/);
  await page.locator('#hero-copy [data-action="launch"]').click();
  const iframe=page.frameLocator('#dreambound-frame');
  await expect(iframe.locator('#loading')).toHaveClass(/hidden/,{timeout:45000});
  await page.locator('[data-game-action="new"]').click();
  await expect(iframe.locator('.story-location')).toContainText('Stacja przebudzenia');
  await expect(iframe.locator('html')).toHaveAttribute('data-pix-animation-clips','11');
  await iframe.getByRole('button',{name:'Pomiń scenę'}).click();
  await expect(iframe.locator('#overlay')).toHaveClass(/hidden/);
  await page.locator('#game-exit').click();
  await expect(page.locator('#control')).toHaveClass(/open/);
  await page.locator('#quick-actions [data-action="home"]').click();
  await expect(page.locator('#console')).toHaveClass(/active/);
  expect(errors).toEqual([]);
});
