document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('to-versos').addEventListener('click', ()=>document.getElementById('versos').scrollIntoView({behavior:'smooth'}));
  // theme toggle (simple)
  const theme = document.getElementById('theme');
  theme.addEventListener('click', ()=>document.body.classList.toggle('light'));
});