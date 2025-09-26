// Simple interactions: smooth scroll and theme toggle
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e){
      e.preventDefault();
      const id = this.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
  // theme toggle on double-click brand
  document.querySelector('.brand').addEventListener('dblclick', ()=>{
    document.body.classList.toggle('light-mode');
  });
});