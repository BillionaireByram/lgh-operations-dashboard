// =====================
// LGH Operations Dashboard
// Supabase Integration
// =====================

// Supabase Config
const SUPABASE_URL = 'https://aqcnqxmqksashphcvgoc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxY25xeG1xa3Nhc2hwaGN2Z29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Mjk4MzcsImV4cCI6MjA4NjQwNTgzN30.-ZBQWTv1HaJ9WzTLqWYIooLXKDIfQXGnfh43sjeWivo';

// Initialize Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Chart instance
let quarterlyChart = null;

// =====================
// Navigation
// =====================

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Update tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update views
        const viewId = tab.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        
        // Load data for the view
        loadViewData(viewId);
    });
});

function loadViewData(viewId) {
    switch(viewId) {
        case 'scorecard': loadScorecard(); break;
        case 'quarterly': loadQuarterly(); break;
        case 'team': loadTeam(); break;
        case 'sales': loadSales(); break;
    }
}

// =====================
// Scorecard View
// =====================

async function loadScorecard() {
    const weekFilter = document.getElementById('weekFilter').value;
    const deptFilter = document.getElementById('deptFilter').value;
    
    let query = db.from('kpi_metrics').select('*').order('department').order('metric_name');
    
    if (weekFilter) {
        query = query.eq('week_of', weekFilter);
    }
    if (deptFilter) {
        query = query.eq('department', deptFilter);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error loading KPIs:', error);
        document.getElementById('kpiBody').innerHTML = '<tr><td colspan="7" class="loading">Error loading data</td></tr>';
        return;
    }
    
    // Update summary counts
    const greenCount = data.filter(d => d.status === 'green').length;
    const yellowCount = data.filter(d => d.status === 'yellow').length;
    const redCount = data.filter(d => d.status === 'red').length;
    
    document.getElementById('greenCount').textContent = greenCount;
    document.getElementById('yellowCount').textContent = yellowCount;
    document.getElementById('redCount').textContent = redCount;
    
    // Update table
    const tbody = document.getElementById('kpiBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No KPIs found. Add some!</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(kpi => `
        <tr>
            <td>${kpi.department || '-'}</td>
            <td>${kpi.metric_name || '-'}</td>
            <td>${formatNumber(kpi.weekly_value)}</td>
            <td>${formatNumber(kpi.monthly_actual)}</td>
            <td>${formatNumber(kpi.monthly_target)}</td>
            <td><span class="status-badge ${kpi.status || ''}">${getStatusIcon(kpi.status)} ${kpi.status || '-'}</span></td>
            <td>${kpi.owner || '-'}</td>
        </tr>
    `).join('');
    
    updateTimestamp();
}

// =====================
// Quarterly View
// =====================

async function loadQuarterly() {
    const yearFilter = document.getElementById('yearFilter').value;
    
    const { data, error } = await db
        .from('quarterly_targets')
        .select('*')
        .eq('year', parseInt(yearFilter))
        .order('quarter');
    
    if (error) {
        console.error('Error loading quarterly:', error);
        return;
    }
    
    // Update table
    const tbody = document.getElementById('quarterlyBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No quarterly data. Add targets!</td></tr>';
    } else {
        tbody.innerHTML = data.map(q => `
            <tr>
                <td><strong>${q.quarter} ${q.year}</strong></td>
                <td>${formatCurrency(q.projected_revenue)}</td>
                <td>${formatCurrency(q.actual_revenue)}</td>
                <td>${formatCurrency(q.projected_profit)}</td>
                <td>${formatCurrency(q.actual_profit)}</td>
                <td>${q.actual_margin ? q.actual_margin + '%' : (q.projected_margin ? q.projected_margin + '%' : '-')}</td>
                <td>${q.notes || '-'}</td>
            </tr>
        `).join('');
    }
    
    // Update chart
    updateQuarterlyChart(data);
    updateTimestamp();
}

function updateQuarterlyChart(data) {
    const ctx = document.getElementById('quarterlyChart').getContext('2d');
    
    if (quarterlyChart) {
        quarterlyChart.destroy();
    }
    
    const labels = data.map(d => d.quarter);
    
    quarterlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Projected Revenue',
                    data: data.map(d => d.projected_revenue || 0),
                    backgroundColor: 'rgba(229, 57, 53, 0.3)',
                    borderColor: '#E53935',
                    borderWidth: 2
                },
                {
                    label: 'Actual Revenue',
                    data: data.map(d => d.actual_revenue || 0),
                    backgroundColor: 'rgba(34, 197, 94, 0.3)',
                    borderColor: '#22c55e',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    ticks: { 
                        color: '#888',
                        callback: value => '$' + (value / 1000) + 'k'
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

// =====================
// Team View
// =====================

async function loadTeam() {
    const deptFilter = document.getElementById('teamDeptFilter').value;
    
    let query = db.from('team_members').select('*').eq('active', true).order('department').order('name');
    
    if (deptFilter) {
        query = query.eq('department', deptFilter);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error loading team:', error);
        return;
    }
    
    const grid = document.getElementById('teamGrid');
    
    if (data.length === 0) {
        grid.innerHTML = '<div class="loading">No team members found. Add some!</div>';
        return;
    }
    
    grid.innerHTML = data.map(member => `
        <div class="team-card">
            <div class="team-card-header">
                <div>
                    <div class="team-name">${member.name}</div>
                    <div class="team-role">${member.role}</div>
                </div>
                <span class="team-dept">${member.department || 'General'}</span>
            </div>
            ${member.manager ? `<div class="team-manager">Reports to: ${member.manager}</div>` : ''}
            ${member.responsibilities && member.responsibilities.length ? `
                <div class="team-section-title">Responsibilities</div>
                <ul class="team-list">
                    ${member.responsibilities.map(r => `<li>${r}</li>`).join('')}
                </ul>
            ` : ''}
            ${member.playbooks && member.playbooks.length ? `
                <div class="team-section-title">Playbooks</div>
                ${member.playbooks.map((p, i) => `<a href="${p}" target="_blank" class="team-playbook">📄 Playbook ${i+1}</a>`).join('')}
            ` : ''}
        </div>
    `).join('');
    
    updateTimestamp();
}

// =====================
// Sales View
// =====================

async function loadSales() {
    const repFilter = document.getElementById('repFilter').value;
    const outcomeFilter = document.getElementById('outcomeFilter').value;
    
    let query = db.from('sales_calls').select('*').order('call_date', { ascending: false });
    
    if (repFilter) {
        query = query.eq('rep_name', repFilter);
    }
    if (outcomeFilter) {
        query = query.eq('outcome', outcomeFilter);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error loading sales:', error);
        return;
    }
    
    // Update summary
    const totalCalls = data.length;
    const closedDeals = data.filter(d => d.outcome === 'Closed').length;
    const closeRate = totalCalls > 0 ? Math.round((closedDeals / totalCalls) * 100) : 0;
    const totalRevenue = data.reduce((sum, d) => sum + (d.deal_value || 0), 0);
    
    document.getElementById('totalCalls').textContent = totalCalls;
    document.getElementById('closedDeals').textContent = closedDeals;
    document.getElementById('closeRate').textContent = closeRate + '%';
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    
    // Update rep filter options
    const reps = [...new Set(data.map(d => d.rep_name).filter(Boolean))];
    const repSelect = document.getElementById('repFilter');
    const currentRep = repSelect.value;
    repSelect.innerHTML = '<option value="">All Reps</option>' + 
        reps.map(rep => `<option value="${rep}" ${rep === currentRep ? 'selected' : ''}>${rep}</option>`).join('');
    
    // Update table
    const tbody = document.getElementById('salesBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No sales calls found. Add some!</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(call => `
        <tr>
            <td>${formatDate(call.call_date)}</td>
            <td>${call.rep_name || '-'}</td>
            <td>${call.prospect_name || '-'}</td>
            <td>${call.call_type || '-'}</td>
            <td><span class="status-badge ${getOutcomeClass(call.outcome)}">${call.outcome || '-'}</span></td>
            <td>${formatCurrency(call.deal_value)}</td>
            <td>${call.recording_url ? `<a href="${call.recording_url}" target="_blank" class="recording-link">▶ Play</a>` : '-'}</td>
        </tr>
    `).join('');
    
    updateTimestamp();
}

function getOutcomeClass(outcome) {
    switch(outcome) {
        case 'Closed': return 'green';
        case 'Lost': return 'red';
        case 'No Show': return 'red';
        default: return 'yellow';
    }
}

// =====================
// Form Submissions
// =====================

async function submitKPI(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const data = {
        week_of: formData.get('week_of'),
        department: formData.get('department'),
        metric_name: formData.get('metric_name'),
        weekly_value: parseFloat(formData.get('weekly_value')) || null,
        monthly_actual: parseFloat(formData.get('monthly_actual')) || null,
        monthly_target: parseFloat(formData.get('monthly_target')) || null,
        status: formData.get('status'),
        owner: formData.get('owner'),
        source: formData.get('source')
    };
    
    const { error } = await db.from('kpi_metrics').insert([data]);
    
    if (error) {
        alert('Error saving KPI: ' + error.message);
        return;
    }
    
    form.reset();
    closeModal('kpiModal');
    loadScorecard();
}

async function submitQuarterly(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const data = {
        quarter: formData.get('quarter'),
        year: parseInt(formData.get('year')),
        projected_revenue: parseFloat(formData.get('projected_revenue')) || null,
        projected_profit: parseFloat(formData.get('projected_profit')) || null,
        actual_revenue: parseFloat(formData.get('actual_revenue')) || null,
        actual_profit: parseFloat(formData.get('actual_profit')) || null,
        notes: formData.get('notes')
    };
    
    // Calculate margins if we have the data
    if (data.projected_revenue && data.projected_profit) {
        data.projected_margin = ((data.projected_profit / data.projected_revenue) * 100).toFixed(2);
    }
    if (data.actual_revenue && data.actual_profit) {
        data.actual_margin = ((data.actual_profit / data.actual_revenue) * 100).toFixed(2);
    }
    
    const { error } = await db.from('quarterly_targets').insert([data]);
    
    if (error) {
        alert('Error saving quarter: ' + error.message);
        return;
    }
    
    form.reset();
    closeModal('quarterlyModal');
    loadQuarterly();
}

async function submitTeam(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    // Parse multiline fields into arrays
    const responsibilities = formData.get('responsibilities')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    
    const playbooks = formData.get('playbooks')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    
    const data = {
        name: formData.get('name'),
        role: formData.get('role'),
        department: formData.get('department'),
        manager: formData.get('manager'),
        responsibilities: responsibilities,
        playbooks: playbooks,
        active: true
    };
    
    const { error } = await db.from('team_members').insert([data]);
    
    if (error) {
        alert('Error saving team member: ' + error.message);
        return;
    }
    
    form.reset();
    closeModal('teamModal');
    loadTeam();
}

async function submitSales(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const data = {
        call_date: formData.get('call_date'),
        rep_name: formData.get('rep_name'),
        prospect_name: formData.get('prospect_name'),
        call_type: formData.get('call_type'),
        outcome: formData.get('outcome'),
        deal_value: parseFloat(formData.get('deal_value')) || null,
        recording_url: formData.get('recording_url'),
        notes: formData.get('notes')
    };
    
    const { error } = await db.from('sales_calls').insert([data]);
    
    if (error) {
        alert('Error saving call: ' + error.message);
        return;
    }
    
    form.reset();
    closeModal('salesModal');
    loadSales();
}

// =====================
// Modal Functions
// =====================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// =====================
// Utility Functions
// =====================

function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString();
}

function formatCurrency(num) {
    if (num === null || num === undefined) return '-';
    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusIcon(status) {
    switch(status) {
        case 'green': return '🟢';
        case 'yellow': return '🟡';
        case 'red': return '🔴';
        default: return '⚪';
    }
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('lastUpdated').textContent = 'Updated: ' + now.toLocaleTimeString();
}

function refreshData() {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        loadViewData(activeTab.dataset.view);
    }
}

// =====================
// Initialize
// =====================

document.addEventListener('DOMContentLoaded', () => {
    loadScorecard();
});
