new Vue({
    el: '#app',
    data: {
        groups: [],
        search: '',
        regionFilter: '',
        sortKey: '',
        sortOrder: 1 // 1 for ascending, -1 for descending
    },
    computed: {
        regions() {
            return [...new Set(this.groups.map(group => group.region))].sort();
        },
        filteredGroups() {
            return this.groups
                .filter(group => {
                    const matchSearch = Object.values(group)
                        .join(' ')
                        .toLowerCase()
                        .includes(this.search.toLowerCase());
                    const matchRegion = !this.regionFilter || group.region === this.regionFilter;
                    return matchSearch && matchRegion;
                })
                .sort((a, b) => {
                    if (!this.sortKey) return 0;
                    const aVal = a[this.sortKey];
                    const bVal = b[this.sortKey];
                    return this.sortOrder * (aVal > bVal ? 1 : -1);
                });
        }
    },
    methods: {
        async loadGroups() {
            try {
                const response = await fetch('../groups.json');
                const data = await response.json();
                this.groups = data.groups;
            } catch (error) {
                console.error('加载群组数据失败:', error);
                this.groups = [];
            }
        },
        sort(key) {
            if (this.sortKey === key) {
                this.sortOrder *= -1;
            } else {
                this.sortKey = key;
                this.sortOrder = 1;
            }
        }
    },
    mounted() {
        this.loadGroups();
    }
});