// ======================
// 配置区
// ======================
const API_BASE_URL = 'https://api.yangyus8.top/api/tasks';

// ======================
// DOM
// ======================
const taskForm = document.getElementById('taskForm');
const formMessage = document.getElementById('formMessage');
const taskList = document.getElementById('taskList');
const listMessage = document.getElementById('listMessage');
const statusFilter = document.getElementById('statusFilter');
const loadTasksBtn = document.getElementById('loadTasksBtn');

// ======================
// 消息提示
// ======================
function showMessage(el, text, type = 'info') {
  el.textContent = text;
  el.style.color = type === 'error' ? '#dc2626' : 
                   type === 'success' ? '#16a34a' : '#6b7280';
  setTimeout(() => el.textContent = '', 3000);
}

// ======================
// 日期格式化
// ======================
function formatDate(isoStr) {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
}

// ======================
// 获取任务（容错版）
// ======================
async function fetchTasks() {
  try {
    const res = await fetch(API_BASE_URL);
    if (!res.ok) throw new Error('加载失败');
    const data = await res.json();

    // 🔥 修复：无论接口返回什么结构，都安全读取
    const tasks = Array.isArray(data) ? data : data.data || [];
    return tasks;
  } catch (err) {
    throw err;
  }
}

// ======================
// 创建任务
// ======================
async function createTask(task) {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error('提交失败');
    return await res.json();
  } catch (err) {
    throw err;
  }
}

// ======================
// 渲染任务（超强容错！不会再报错）
// ======================
function renderTasks(tasks, filterStatus = 'all') {
  taskList.innerHTML = '';

  const filtered = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  if (filtered.length === 0) {
    listMessage.textContent = '暂无任务';
    return;
  }
  listMessage.textContent = '';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';

    // 🔥 容错：字段不存在也不会崩溃
    const title = task.title || '无标题';
    const owner = task.owner || '未知';
    const status = task.status || 'todo';
    const createdAt = task.createdAt || '';

    const statusMap = {
      todo: { text: '待开始', class: 'todo' },
      doing: { text: '进行中', class: 'doing' },
      done: { text: '已完成', class: 'done' }
    };
    const statusInfo = statusMap[status] || statusMap.todo;

    li.innerHTML = `
      <h3>${title}</h3>
      <div class="task-meta">
        <span>负责人：${owner}</span>
        <span class="badge ${statusInfo.class}">${statusInfo.text}</span>
        ${createdAt ? `<span>创建时间：${formatDate(createdAt)}</span>` : ''}
      </div>
    `;
    taskList.appendChild(li);
  });
}

// ======================
// 加载任务
// ======================
async function loadTasks(filter = 'all') {
  try {
    listMessage.textContent = '加载中...';
    const tasks = await fetchTasks();
    renderTasks(tasks, filter);
    showMessage(listMessage, '加载成功', 'success');
  } catch (err) {
    showMessage(listMessage, err.message, 'error');
    taskList.innerHTML = '';
  }
}

// ======================
// 提交表单
// ======================
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(taskForm);
  const newTask = {
    title: formData.get('title').trim(),
    owner: formData.get('owner').trim(),
    status: formData.get('status'),
  };

  if (!newTask.title || !newTask.owner) {
    showMessage(formMessage, '请填写完整信息', 'error');
    return;
  }

  try {
    await createTask(newTask);
    showMessage(formMessage, '提交成功', 'success');
    taskForm.reset();
    loadTasks(statusFilter.value);
  } catch (err) {
    showMessage(formMessage, err.message, 'error');
  }
});

// ======================
// 筛选 + 刷新
// ======================
statusFilter.addEventListener('change', () => loadTasks(statusFilter.value));
loadTasksBtn.addEventListener('click', () => loadTasks(statusFilter.value));

// ======================
// 初始化
// ======================
document.addEventListener('DOMContentLoaded', () => loadTasks());