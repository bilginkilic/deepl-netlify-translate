<div
    id="<?= e($id) ?>"
    class="inspera-ds-mapper"
    data-handler="<?= e($this->getEventHandler('onLoadTableColumns')) ?>"
    data-field-name="<?= e($name) ?>"
    data-value="<?= e($valueJson) ?>"
>
    <input type="hidden" name="<?= e($name) ?>" value="<?= e($valueJson) ?>" class="inspera-ds-mapper-input" />

    <div class="inspera-ds-mapper-db">
        <div class="form-group">
            <label>Veritabanı tablosu</label>
            <select class="form-control inspera-ds-table-select">
                <option value="">— Tablo seçin —</option>
                <?php foreach ($tables as $tableValue => $tableLabel): ?>
                    <option value="<?= e($tableValue) ?>" <?= ($value['table_name'] ?? '') === $tableValue ? 'selected' : '' ?>>
                        <?= e($tableLabel) ?>
                    </option>
                <?php endforeach ?>
            </select>
        </div>
    </div>

    <div class="inspera-ds-mapper-cms">
        <div class="form-group">
            <label>CMS sayfaları</label>
            <input type="text" class="form-control inspera-ds-page-filter" placeholder="Sayfa ara…" />
            <div class="inspera-ds-page-list">
                <?php foreach ($cmsPages as $file => $label): ?>
                    <?php $checked = in_array($file, $value['pages'] ?? [], true); ?>
                    <label class="inspera-ds-page-item" data-label="<?= e(mb_strtolower($label . ' ' . $file)) ?>">
                        <input type="checkbox" class="inspera-ds-page-checkbox" value="<?= e($file) ?>" <?= $checked ? 'checked' : '' ?> />
                        <span><?= e($label) ?></span>
                        <small><?= e($file) ?></small>
                    </label>
                <?php endforeach ?>
            </div>
            <p class="help-block">Boş bırakırsanız aktif temadaki tüm sayfalar taranır.</p>
        </div>
    </div>

    <div class="inspera-ds-mapper-board">
        <p class="help-block">
            Alanları sürükleyip bırakarak arama ve gösterim alanlarını tanımlayın. Anahtar kelime yazmanız gerekmez; seçili alan adları otomatik kullanılır.
        </p>

        <div class="inspera-ds-mapper-grid">
            <div class="inspera-ds-zone" data-zone="pool">
                <h4>Kullanılabilir alanlar</h4>
                <ul class="inspera-ds-sortable"></ul>
            </div>
            <div class="inspera-ds-zone inspera-ds-zone-search" data-zone="search">
                <h4>Arama alanları</h4>
                <ul class="inspera-ds-sortable"></ul>
            </div>
            <div class="inspera-ds-zone inspera-ds-zone-display" data-zone="display">
                <h4>Gösterim alanları</h4>
                <ul class="inspera-ds-sortable"></ul>
            </div>
        </div>

        <div class="form-group">
            <label>Başlık alanı</label>
            <select class="form-control inspera-ds-title-field">
                <option value="">— Otomatik —</option>
            </select>
        </div>
    </div>
</div>
