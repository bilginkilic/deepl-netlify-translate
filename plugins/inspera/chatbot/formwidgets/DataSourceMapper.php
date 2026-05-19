<?php declare(strict_types=1);

namespace Inspera\Chatbot\FormWidgets;

use Backend\Classes\FormWidgetBase;
use Inspera\Chatbot\Classes\DataSourceCatalog;

class DataSourceMapper extends FormWidgetBase
{
    protected $defaultAlias = 'datasourcemapper';

    public function render()
    {
        $this->prepareVars();

        return $this->makePartial('datasourcemapper');
    }

    public function prepareVars(): void
    {
        $value = DataSourceCatalog::normalizeMapper($this->getLoadValue());

        $this->vars['name'] = $this->getFieldName();
        $this->vars['id'] = $this->getId();
        $this->vars['value'] = $value;
        $this->vars['valueJson'] = json_encode($value, JSON_UNESCAPED_UNICODE);
        $this->vars['tables'] = DataSourceCatalog::listTables();
        $this->vars['cmsPages'] = DataSourceCatalog::listCmsPages();
        $this->vars['cmsFields'] = DataSourceCatalog::cmsFieldCatalog();
        $this->vars['columns'] = $value['table_name'] !== ''
            ? DataSourceCatalog::listColumns($value['table_name'])
            : [];
    }

    public function loadAssets(): void
    {
        $this->addCss('css/datasourcemapper.css');
        $this->addJs('js/datasourcemapper.js');
    }

    public function onLoadTableColumns()
    {
        $table = trim((string) post('table_name'));

        return [
            'columns' => DataSourceCatalog::listColumns($table),
        ];
    }

    public function getSaveValue($value)
    {
        if (is_array($value)) {
            return json_encode(DataSourceCatalog::normalizeMapper($value), JSON_UNESCAPED_UNICODE);
        }

        if (is_string($value) && $value !== '') {
            return $value;
        }

        return json_encode(DataSourceCatalog::normalizeMapper([]), JSON_UNESCAPED_UNICODE);
    }
}
