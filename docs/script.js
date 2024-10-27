const apiBaseUrl = 'https://line-bot-webhook-pdbb.onrender.com';

// ユーザー一覧を取得して表示
async function fetchUsers() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/users`);
    const users = await response.json();

    const tableBody = document.getElementById('user-table-body');
    tableBody.innerHTML = '';

    users.forEach(user => {
      const row = document.createElement('tr');

      // User ID
      const userIdCell = document.createElement('td');
      userIdCell.textContent = user.userId;
      row.appendChild(userIdCell);

      // 表示名
      const displayNameCell = document.createElement('td');
      displayNameCell.textContent = user.displayName;
      row.appendChild(displayNameCell);

      // 対応状態
      const statusCell = document.createElement('td');
      statusCell.textContent = user.status || '未対応';
      row.appendChild(statusCell);

      // 操作
      const actionCell = document.createElement('td');
      const toggleButton = document.createElement('button');
      toggleButton.textContent = user.status === '対応中' ? '未対応にする' : '対応中にする';
      toggleButton.addEventListener('click', () => {
        const newStatus = user.status === '対応中' ? '未対応' : '対応中';
        updateUserStatus(user.userId, newStatus);
      });
      actionCell.appendChild(toggleButton);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('ユーザー一覧の取得に失敗しました:', error);
  }
}

// ユーザーの対応状態を更新
async function updateUserStatus(userId, status) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/users/${userId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      alert('対応状態を更新しました');
      fetchUsers(); // 更新後にユーザー一覧を再取得
    } else {
      const errorData = await response.json();
      alert(`更新に失敗しました: ${errorData.error}`);
    }
  } catch (error) {
    console.error('対応状態の更新に失敗しました:', error);
  }
}

// ページ読み込み時にユーザー一覧を取得
window.onload = fetchUsers;
