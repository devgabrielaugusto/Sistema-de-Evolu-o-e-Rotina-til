document.addEventListener('DOMContentLoaded', () => {
    const apiEndpoint = 'api/tasks.php';
    
    const colTodo = document.getElementById('col-todo');
    const colInProgress = document.getElementById('col-in_progress');
    const colDone = document.getElementById('col-done');
    
    const countTodo = document.getElementById('count-todo');
    const countInProgress = document.getElementById('count-in_progress');
    const countDone = document.getElementById('count-done');
    
    const addTaskForm = document.getElementById('add-task-form');
    const taskTemplate = document.getElementById('task-template').content;

    // Initialize Sortable on the columns
    const sortableOptions = {
        group: 'shared', // set both lists to same group
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: function (evt) {
            const itemEl = evt.item;  // dragged HTMLElement
            const toCol = evt.to;    // target list
            const newStatus = toCol.dataset.status;
            const taskId = itemEl.dataset.id;
            const taskRep = itemEl.dataset.repetition;
            
            // If the item was actually moved to a different list
            if (evt.from !== toCol) {
                updateTaskStatus(taskId, newStatus, taskRep);
            }
        },
    };

    new Sortable(colTodo, sortableOptions);
    new Sortable(colInProgress, sortableOptions);
    new Sortable(colDone, sortableOptions);

    // Fetch and render tasks on load
    fetchTasks();

    // Handle form submission for new tasks
    addTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const rep = document.getElementById('task-rep').value;
        
        const submitBtn = addTaskForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        
        await createTask({ title, description: desc, repetition: rep });
        
        addTaskForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Adicionar';
    });

    // API calls

    async function fetchTasks() {
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) throw new Error('Network response was not ok');
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            // Ignore error for now, or display a UI notification
        }
    }

    async function createTask(taskData) {
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) throw new Error('Failed to create task');
            
            // Re-fetch all tasks to ensure correct state and get generated ID
            await fetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
        }
    }

    async function updateTaskStatus(id, status, repetition) {
        try {
            const response = await fetch(`${apiEndpoint}?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, repetition })
            });
            if (!response.ok) throw new Error('Failed to update task');
            
            // Re-fetch if we moved it to done and it has repetition, 
            // since backend will recycle it back to todo
            if (status === 'done' && repetition !== 'none') {
                setTimeout(() => {
                    fetchTasks();
                }, 500); // slight delay for visual feedback
            } else {
                updateCounts();
            }
        } catch (error) {
            console.error('Error updating task:', error);
            fetchTasks(); // rollback UI on error
        }
    }

    async function deleteTask(id) {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
        
        try {
            const response = await fetch(`${apiEndpoint}?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete task');
            
            // Remove from UI directly
            const el = document.querySelector(`.task-card[data-id="${id}"]`);
            if (el) el.remove();
            updateCounts();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    // UI Rendering

    function renderTasks(tasks) {
        // Clear columns
        colTodo.innerHTML = '';
        colInProgress.innerHTML = '';
        colDone.innerHTML = '';

        if (Array.isArray(tasks)) {
            tasks.forEach(task => {
                const taskEl = createTaskElement(task);
                
                if (task.status === 'todo') {
                    colTodo.appendChild(taskEl);
                } else if (task.status === 'in_progress') {
                    colInProgress.appendChild(taskEl);
                } else if (task.status === 'done') {
                    colDone.appendChild(taskEl);
                }
            });
        }
        
        updateCounts();
    }

    function createTaskElement(task) {
        const clone = document.importNode(taskTemplate, true);
        const card = clone.querySelector('.task-card');
        
        card.dataset.id = task.id;
        card.dataset.repetition = task.repetition;
        
        clone.querySelector('.task-title').textContent = task.title;
        
        const descEl = clone.querySelector('.task-desc');
        if (task.description) {
            descEl.textContent = task.description;
        } else {
            descEl.style.display = 'none';
        }
        
        const badgeEl = clone.querySelector('.task-rep-badge');
        const iconMap = {
            'daily': '<i class="fa-solid fa-rotate-right"></i> Diária',
            'weekly': '<i class="fa-solid fa-calendar-week"></i> Semanal',
            'monthly': '<i class="fa-solid fa-calendar-days"></i> Mensal'
        };
        
        if (task.repetition && task.repetition !== 'none') {
            badgeEl.innerHTML = iconMap[task.repetition] || '';
        } else {
            badgeEl.style.display = 'none';
        }
        
        clone.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation(); // prevent drag
            deleteTask(task.id);
        });
        
        return card;
    }

    function updateCounts() {
        countTodo.textContent = colTodo.children.length;
        countInProgress.textContent = colInProgress.children.length;
        countDone.textContent = colDone.children.length;
    }
});
