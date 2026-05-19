+function ($) {
    'use strict';

    var DataSourceMapper = function (element) {
        this.$root = $(element);
        this.$input = this.$root.find('.inspera-ds-mapper-input');
        this.$tableSelect = this.$root.find('.inspera-ds-table-select');
        this.$titleField = this.$root.find('.inspera-ds-title-field');
        this.$pageFilter = this.$root.find('.inspera-ds-page-filter');
        this.$pageCheckboxes = this.$root.find('.inspera-ds-page-checkbox');
        this.handler = this.$root.data('handler');
        this.state = this.parseValue(this.$root.data('value'));
        this.catalog = {};
        this.sortables = [];
        this.init();
    };

    DataSourceMapper.prototype.parseValue = function (raw) {
        if (typeof raw === 'object' && raw !== null) {
            return this.normalizeState(raw);
        }

        if (typeof raw === 'string' && raw.length) {
            try {
                return this.normalizeState(JSON.parse(raw));
            } catch (e) {
                return this.normalizeState({});
            }
        }

        return this.normalizeState({});
    };

    DataSourceMapper.prototype.normalizeState = function (value) {
        return {
            table_name: value.table_name || '',
            search_fields: Array.isArray(value.search_fields) ? value.search_fields.slice() : [],
            display_fields: Array.isArray(value.display_fields) ? value.display_fields.slice() : [],
            title_field: value.title_field || '',
            pages: Array.isArray(value.pages) ? value.pages.slice() : []
        };
    };

    DataSourceMapper.prototype.init = function () {
        var self = this;

        this.syncTypeClass();
        this.bindTypeWatcher();
        this.renderBoard();
        this.bindTableSelect();
        this.bindPageFilter();
        this.bindPageChecks();
        this.$root.on('change', '.inspera-ds-page-checkbox', function () {
            self.collectPages();
            self.persist();
        });
        this.$titleField.on('change', function () {
            self.state.title_field = self.$titleField.val() || '';
            self.persist();
        });

        $(document).on('ajaxUpdateComplete', function () {
            self.syncTypeClass();
        });
    };

    DataSourceMapper.prototype.getSourceType = function () {
        var self = this;
        var $type = this.$root.closest('.field-repeater-item').find('select').filter(function () {
            var name = $(this).attr('name') || '';
            return name.indexOf('[type]') !== -1;
        }).first();

        return ($type.val() || '').toString();
    };

    DataSourceMapper.prototype.syncTypeClass = function () {
        var type = this.getSourceType();
        this.$root.removeClass('is-static is-database is-cms is-empty-type');

        if (!type || type === 'static') {
            this.$root.addClass(type === 'static' ? 'is-static' : 'is-empty-type');
            return;
        }

        if (type === 'database_table') {
            this.$root.addClass('is-database');
            return;
        }

        if (type === 'cms_pages') {
            this.$root.addClass('is-cms');
            this.loadCmsCatalog();
            return;
        }

        this.$root.addClass('is-empty-type');
    };

    DataSourceMapper.prototype.bindTypeWatcher = function () {
        var self = this;
        $(document).on('change', 'select[name*="[type]"]', function () {
            if ($(this).closest('.field-repeater-item').get(0) !== self.$root.closest('.field-repeater-item').get(0)) {
                return;
            }
            self.syncTypeClass();
            self.renderBoard();
        });
    };

    DataSourceMapper.prototype.bindTableSelect = function () {
        var self = this;

        this.$tableSelect.on('change', function () {
            var table = $(this).val() || '';
            self.state.table_name = table;
            self.state.search_fields = [];
            self.state.display_fields = [];
            self.state.title_field = '';

            if (!table) {
                self.catalog = {};
                self.renderBoard();
                self.persist();
                return;
            }

            $.request(self.handler, {
                data: { table_name: table },
                success: function (data) {
                    self.catalog = data.columns || {};
                    self.renderBoard();
                    self.persist();
                }
            });
        });

        if (this.state.table_name && Object.keys(this.catalog).length === 0) {
            $.request(this.handler, {
                data: { table_name: this.state.table_name },
                success: function (data) {
                    self.catalog = data.columns || {};
                    self.renderBoard();
                }
            });
        }
    };

    DataSourceMapper.prototype.loadCmsCatalog = function () {
        this.catalog = {
            title: 'Sayfa başlığı',
            url: 'URL',
            markup: 'Sayfa içeriği (markup)',
            meta_title: 'Meta başlık',
            meta_description: 'Meta açıklama'
        };

        if (this.state.search_fields.length === 0 && this.state.display_fields.length === 0) {
            this.state.search_fields = ['title', 'url', 'markup', 'meta_description'];
            this.state.display_fields = ['title', 'url', 'meta_description'];
            this.state.title_field = 'title';
        }
    };

    DataSourceMapper.prototype.bindPageFilter = function () {
        var self = this;
        this.$pageFilter.on('input', function () {
            var q = ($(this).val() || '').toLowerCase();
            self.$root.find('.inspera-ds-page-item').each(function () {
                var label = ($(this).data('label') || '').toString();
                $(this).toggle(!q || label.indexOf(q) !== -1);
            });
        });
    };

    DataSourceMapper.prototype.bindPageChecks = function () {
        this.collectPages();
    };

    DataSourceMapper.prototype.collectPages = function () {
        var pages = [];
        this.$pageCheckboxes.filter(':checked').each(function () {
            pages.push($(this).val());
        });
        this.state.pages = pages;
    };

    DataSourceMapper.prototype.renderBoard = function () {
        var type = this.getSourceType();
        if (type === 'cms_pages') {
            this.loadCmsCatalog();
        }

        this.destroySortables();
        this.renderZone('pool');
        this.renderZone('search', this.state.search_fields);
        this.renderZone('display', this.state.display_fields);
        this.renderTitleOptions();
        this.initSortables();
    };

    DataSourceMapper.prototype.renderZone = function (zone, selected) {
        var $list = this.$root.find('.inspera-ds-zone[data-zone="' + zone + '"] .inspera-ds-sortable');
        $list.empty();

        var used = {};
        (this.state.search_fields || []).forEach(function (key) { used[key] = true; });
        (this.state.display_fields || []).forEach(function (key) { used[key] = true; });

        var keys = selected || Object.keys(this.catalog).filter(function (key) {
            return !used[key];
        });

        keys.forEach(function (key) {
            var label = this.catalog[key] || key;
            $list.append(this.chipHtml(key, label));
        }, this);
    };

    DataSourceMapper.prototype.chipHtml = function (key, label) {
        return $('<li class="inspera-ds-chip" draggable="true"></li>')
            .attr('data-key', key)
            .append($('<span class="inspera-ds-chip-label"></span>').text(label))
            .append($('<span class="inspera-ds-chip-key"></span>').text(key));
    };

    DataSourceMapper.prototype.renderTitleOptions = function () {
        var self = this;
        var current = this.state.title_field || '';
        this.$titleField.empty().append($('<option value="">— Otomatik —</option>'));

        this.state.display_fields.forEach(function (key) {
            var label = self.catalog[key] || key;
            var $option = $('<option></option>').val(key).text(label + ' (' + key + ')');
            if (current === key) {
                $option.prop('selected', true);
            }
            self.$titleField.append($option);
        });
    };

    DataSourceMapper.prototype.initSortables = function () {
        var self = this;
        this.$root.find('.inspera-ds-sortable').each(function () {
            var $list = $(this);
            var zone = $list.closest('.inspera-ds-zone').data('zone');

            $list.on('dragover', function (event) {
                event.preventDefault();
                $list.addClass('is-drag-over');
            });

            $list.on('dragleave drop', function () {
                $list.removeClass('is-drag-over');
            });

            $list.on('drop', function (event) {
                event.preventDefault();
                $list.removeClass('is-drag-over');
                var key = event.originalEvent.dataTransfer.getData('text/plain');
                if (!key) {
                    return;
                }
                self.moveChip(key, zone);
            });

            $list.find('.inspera-ds-chip').each(function () {
                this.addEventListener('dragstart', function (event) {
                    event.dataTransfer.setData('text/plain', $(this).data('key'));
                });
            });
        });
    };

    DataSourceMapper.prototype.moveChip = function (key, targetZone) {
        if (targetZone === 'pool') {
            this.state.search_fields = this.state.search_fields.filter(function (item) { return item !== key; });
            this.state.display_fields = this.state.display_fields.filter(function (item) { return item !== key; });
        } else if (targetZone === 'search') {
            this.state.display_fields = this.state.display_fields.filter(function (item) { return item !== key; });
            if (this.state.search_fields.indexOf(key) === -1) {
                this.state.search_fields.push(key);
            }
        } else if (targetZone === 'display') {
            this.state.search_fields = this.state.search_fields.filter(function (item) { return item !== key; });
            if (this.state.display_fields.indexOf(key) === -1) {
                this.state.display_fields.push(key);
            }
        }

        if (this.state.title_field && this.state.display_fields.indexOf(this.state.title_field) === -1) {
            this.state.title_field = this.state.display_fields[0] || '';
        }

        this.renderBoard();
        this.persist();
    };

    DataSourceMapper.prototype.destroySortables = function () {
        this.$root.find('.inspera-ds-sortable').off('dragover dragleave drop');
    };

    DataSourceMapper.prototype.persist = function () {
        this.$input.val(JSON.stringify(this.state));
    };

    DataSourceMapper.prototype.dispose = function () {
        this.destroySortables();
        this.$root.removeData('oc.insperaDataSourceMapper');
    };

    $.fn.insperaDataSourceMapper = function (option) {
        var args = arguments;
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.insperaDataSourceMapper');
            if (!data) {
                $this.data('oc.insperaDataSourceMapper', new DataSourceMapper(this));
            } else if (typeof option === 'string') {
                data[option].apply(data, Array.prototype.slice.call(args, 1));
            }
        });
    };

    $(document).render(function () {
        $('.inspera-ds-mapper').insperaDataSourceMapper();
    });
}(window.jQuery);
