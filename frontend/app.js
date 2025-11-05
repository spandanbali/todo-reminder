// const $ = (sel) => document.querySelector(sel);
// const $$ = (sel) => document.querySelectorAll(sel);

// let currentUser = null;

// function show(selector) {
//   document.querySelectorAll('#auth-area > div, #app-area').forEach(el => el.style.display = 'none');
//   document.querySelector(selector).style.display = 'block';
// }

// document.addEventListener('DOMContentLoaded', () => {
//   // initial view: login
//   show('#login-form');

//   $('#showSignup').onclick = () => show('#signup-form');
//   $('#showLogin').onclick = () => show('#login-form');

//   $('#btnSignup').onclick = async () => {
//     const name = $('#su_name').value;
//     const email = $('#su_email').value;
//     const password = $('#su_password').value;
//     const res = await fetch('/api/users/signup', {
//       method: 'POST', headers: {'Content-Type':'application/json'},
//       body: JSON.stringify({name, email, password})
//     });
//     const j = await res.json();
//     if (res.ok) {
//       currentUser = j;
//       $('#user-email').innerText = j.email;
//       showUserArea();
//     } else {
//       alert(j.error || 'Signup failed');
//     }
//   };

//   $('#btnLogin').onclick = async () => {
//     const email = $('#li_email').value;
//     const password = $('#li_password').value;
//     const res = await fetch('/api/users/login', {
//       method: 'POST', headers: {'Content-Type':'application/json'},
//       body: JSON.stringify({email, password})
//     });
//     const j = await res.json();
//     if (res.ok) {
//       currentUser = j;
//       $('#user-email').innerText = j.email;
//       showUserArea();
//     } else {
//       alert(j.error || 'Login failed');
//     }
//   };

//   $('#btnLogout').onclick = async () => {
//     await fetch('/api/users/logout', {method:'POST'});
//     currentUser = null;
//     show('#login-form');
//   };

//   $('#btnCreateTask').onclick = async () => {
//     const title = $('#task_title').value;
//     const description = $('#task_desc').value;
//     const due = $('#task_due').value ? new Date($('#task_due').value).getTime() : null;
//     const res = await fetch('/api/tasks', {
//       method: 'POST',
//       headers: {'Content-Type':'application/json'},
//       body: JSON.stringify({title, description, due_datetime: due})
//     });
//     const j = await res.json();
//     if (res.ok) {
//       $('#task_title').value = '';
//       $('#task_desc').value = '';
//       $('#task_due').value = '';
//       loadTasks();
//     } else {
//       alert(j.error || 'Failed to add');
//     }
//   };
// });

// function showUserArea() {
//   show('#user-area');
//   document.getElementById('app-area').style.display = 'block';
//   loadTasks();
// }

// async function loadTasks() {
//   const res = await fetch('/api/tasks');
//   if (!res.ok) {
//     const j = await res.json();
//     if (j && j.error === 'Not authenticated') {
//       alert('Please login again');
//       location.reload();
//     }
//     return;
//   }
//   const tasks = await res.json();
//   const tbody = document.querySelector('#tasksTable tbody');
//   tbody.innerHTML = '';
//   tasks.forEach(t => {
//     const tr = document.createElement('tr');
//     const due = t.due_datetime ? new Date(t.due_datetime).toLocaleString() : '--';
//     const status = t.completed ? 'Completed' : 'Pending';
//     tr.innerHTML = `
//       <td>${escapeHtml(t.title)}</td>
//       <td>${due}</td>
//       <td>${status}</td>
//       <td>
//         <button class="btn btn-sm btn-primary btn-edit" data-id="${t.id}">Edit</button>
//         <button class="btn btn-sm btn-${t.completed ? 'secondary' : 'success'} btn-toggle" data-id="${t.id}">${t.completed ? 'Unmark' : 'Complete'}</button>
//         <button class="btn btn-sm btn-danger btn-delete" data-id="${t.id}">Delete</button>
//       </td>
//     `;
//     tbody.appendChild(tr);
//   });

//   document.querySelectorAll('.btn-delete').forEach(btn => {
//     btn.onclick = async () => {
//       if (!confirm('Delete this task?')) return;
//       const id = btn.dataset.id;
//       const res = await fetch('/api/tasks/' + id, {method:'DELETE'});
//       if (res.ok) loadTasks();
//       else alert('Error deleting');
//     };
//   });

//   document.querySelectorAll('.btn-toggle').forEach(btn => {
//     btn.onclick = async () => {
//       const id = btn.dataset.id;
//       // find task
//       const tr = btn.closest('tr');
//       // we will request update by toggling completed
//       // to get full task, fetch tasks array (we have it), but to keep simple: set completed flag
//       // For simplicity, make sure to fetch tasks to get current state
//       const resAll = await fetch('/api/tasks');
//       const list = await resAll.json();
//       const t = list.find(x => x.id === id);
//       const updated = {...t, completed: t.completed ? 0 : 1};
//       const res = await fetch('/api/tasks/' + id, {
//         method: 'PUT',
//         headers: {'Content-Type':'application/json'},
//         body: JSON.stringify({ title: updated.title, description: updated.description, due_datetime: updated.due_datetime, completed: updated.completed })
//       });
//       if (res.ok) loadTasks();
//     };
//   });

//   document.querySelectorAll('.btn-edit').forEach(btn => {
//     btn.onclick = async () => {
//       const id = btn.dataset.id;
//       // fetch tasks and find it
//       const resAll = await fetch('/api/tasks');
//       const list = await resAll.json();
//       const t = list.find(x => x.id === id);
//       if (!t) return alert('Task not found');
//       const newTitle = prompt('Edit title', t.title);
//       if (!newTitle) return;
//       const newDesc = prompt('Edit description', t.description || '');
//       const newDue = prompt('Enter new due date/time as YYYY-MM-DD HH:MM (leave blank to keep)', t.due_datetime ? new Date(t.due_datetime).toISOString().slice(0,16) : '');
//       let dueEpoch = t.due_datetime;
//       if (newDue) {
//         const parsed = new Date(newDue);
//         dueEpoch = parsed.getTime();
//       }
//       const res = await fetch('/api/tasks/' + id, {
//         method: 'PUT',
//         headers: {'Content-Type':'application/json'},
//         body: JSON.stringify({ title: newTitle, description: newDesc, due_datetime: dueEpoch, completed: t.completed })
//       });
//       if (res.ok) loadTasks();
//     };
//   });
// }

// function escapeHtml(text) {
//   if (!text) return '';
//   return text.replace(/[&<>"']/g, function (m) {
//     return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m];
//   });
// }


const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentUser = null;

function show(selector) {
  document.querySelectorAll('#auth-area > div, #app-area').forEach(el => el.style.display = 'none');
  document.querySelector(selector).style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  // initial view: login
  show('#login-form');

  $('#showSignup').onclick = () => show('#signup-form');
  $('#showLogin').onclick = () => show('#login-form');

  $('#btnSignup').onclick = async () => {
    const name = $('#su_name').value;
    const email = $('#su_email').value;
    const password = $('#su_password').value;
    const res = await fetch('/api/users/signup', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name, email, password})
    });
    const j = await res.json();
    if (res.ok) {
      currentUser = j;
      $('#user-email').innerText = j.email;
      showUserArea();
    } else {
      alert(j.error || 'Signup failed');
    }
  };

  $('#btnLogin').onclick = async () => {
    const email = $('#li_email').value;
    const password = $('#li_password').value;
    const res = await fetch('/api/users/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const j = await res.json();
    if (res.ok) {
      currentUser = j;
      $('#user-email').innerText = j.email;
      showUserArea();
    } else {
      alert(j.error || 'Login failed');
    }
  };

  $('#btnLogout').onclick = async () => {
    await fetch('/api/users/logout', {method:'POST'});
    currentUser = null;
    show('#login-form');
  };

  $('#btnCreateTask').onclick = async () => {
    const title = $('#task_title').value;
    const description = $('#task_desc').value;
    const due = $('#task_due').value ? new Date($('#task_due').value).getTime() : null;
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({title, description, due_datetime: due})
    });
    const j = await res.json();
    if (res.ok) {
      $('#task_title').value = '';
      $('#task_desc').value = '';
      $('#task_due').value = '';
      loadTasks();
    } else {
      alert(j.error || 'Failed to add');
    }
  };
});

function showUserArea() {
  show('#user-area');
  document.getElementById('app-area').style.display = 'block';
  loadTasks();
}

async function loadTasks() {
  const res = await fetch('/api/tasks');
  if (!res.ok) {
    const j = await res.json();
    if (j && j.error === 'Not authenticated') {
      alert('Please login again');
      location.reload();
    }
    return;
  }
  const tasks = await res.json();
  const tbody = document.querySelector('#tasksTable tbody');
  tbody.innerHTML = '';
  tasks.forEach(t => {
    const tr = document.createElement('tr');
    const due = t.due_datetime ? new Date(t.due_datetime).toLocaleString() : '--';
    const status = t.completed ? 'Completed' : 'Pending';
    tr.innerHTML = `
      <td>${escapeHtml(t.title)}</td>
      <td>${due}</td>
      <td>${status}</td>
      <td>
        <button class="btn btn-sm btn-primary btn-edit" data-id="${t.id}">Edit</button>
        <button class="btn btn-sm btn-${t.completed ? 'secondary' : 'success'} btn-toggle" data-id="${t.id}">${t.completed ? 'Unmark' : 'Complete'}</button>
        <button class="btn btn-sm btn-danger btn-delete" data-id="${t.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this task?')) return;
      const id = btn.dataset.id;
      const res = await fetch('/api/tasks/' + id, {method:'DELETE'});
      if (res.ok) loadTasks();
      else alert('Error deleting');
    };
  });

  document.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      // Fetch all tasks and find current one
      const resAll = await fetch('/api/tasks');
      const list = await resAll.json();
      const t = list.find(x => x.id === id);
      const updated = {...t, completed: t.completed ? 0 : 1};

      // Update the task completion in backend
      const res = await fetch('/api/tasks/' + id, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ 
          title: updated.title, 
          description: updated.description, 
          due_datetime: updated.due_datetime, 
          completed: updated.completed 
        })
      });

      if (res.ok) {
        loadTasks();
        // ✅ If just marked complete, trigger instant mail
        if (updated.completed === 1) {
          await notifyTaskCompletion(id);
        }
      }
    };
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const resAll = await fetch('/api/tasks');
      const list = await resAll.json();
      const t = list.find(x => x.id === id);
      if (!t) return alert('Task not found');
      const newTitle = prompt('Edit title', t.title);
      if (!newTitle) return;
      const newDesc = prompt('Edit description', t.description || '');
      const newDue = prompt('Enter new due date/time as YYYY-MM-DD HH:MM (leave blank to keep)', t.due_datetime ? new Date(t.due_datetime).toISOString().slice(0,16) : '');
      let dueEpoch = t.due_datetime;
      if (newDue) {
        const parsed = new Date(newDue);
        dueEpoch = parsed.getTime();
      }
      const res = await fetch('/api/tasks/' + id, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title: newTitle, description: newDesc, due_datetime: dueEpoch, completed: t.completed })
      });
      if (res.ok) loadTasks();
    };
  });
}

// ✅ New helper function — send instant mail when task is completed
async function notifyTaskCompletion(taskId) {
  try {
    await fetch("/api/task-completed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    console.log("✅ Completion email triggered");
  } catch (err) {
    console.error("❌ Failed to trigger completion email", err);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, function (m) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m];
  });
}
