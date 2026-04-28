<template>
  <section class="lubanchi-card">
    <div class="title">{{ mockJson.title }}</div>
    <div class="content" v-for="item in mockJson.list">
      <div class="content_title">{{ item.title }}</div>
      <div class="content_table">
        <!-- 表格头部 -->
        <div class="table_head">
          <div v-for="value in mockJson.columns">
            {{ value }}
          </div>
        </div>
        <!-- 表格内容 -->
        <div class="teble_content">
          <div v-for="value in item.content" class="teble_content_row">
            <div>{{ value["range"] }}</div>
            <div>{{ value["mark"] }}</div>
            <div>{{ value["reason"] }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const mockJson = {
  title: "鲁班尺吉利尺寸推荐表",
  columns: {
    range: "数值范围",
    mark: "对应鲁班吉数",
    reason: "寓意与理由",
  },
  list: [
    {
      title: "宽度（毫米）",
      content: [
        {
          range: "810-890",
          mark: "财至",
          reason: "财运亨通，适合家庭正门、卧室门",
        },
        {
          range: "896",
          mark: "吉门",
          reason: "顺科、横财、官运，通用吉祥尺寸",
        },
        { range: "1060-1080", mark: "迎福", reason: "福运临门，适合进户门" },
        { range: "1379-1201", mark: "财门", reason: "财富积累，象征宝库" },
        { range: "1811-1980", mark: "六合", reason: "家庭和谐，事业人际圆满" },
        { range: "2110-2160", mark: "官、吉", reason: "事业晋升，整体吉祥" },
        { range: "2530-2560", mark: "本、财", reason: "根基稳固，持续财运" },
      ],
    },
    {
      title: "高度（毫米）",
      content: [
        {
          range: "1910-1980",
          mark: "登科",
          reason: "学业有成，适合儿童房、书房门",
        },
        { range: "2120-2160", mark: "六合", reason: "家庭兴旺，和谐美满" },
        {
          range: "2310-2360",
          mark: "宝库",
          reason: "财富稳固，适合大门、商铺门",
        },
        { range: "2530-2560", mark: "大吉", reason: "事业腾达，家宅平安" },
        {
          range: "2810-2830",
          mark: "官禄",
          reason: "官运亨通，适合企业、办公室门",
        },
        { range: "2900", mark: "横财", reason: "意外之财，适合偏门、侧门" },
      ],
    },
  ],
};
</script>

<style scoped>
.lubanchi-card {
  background-color: #fff;
  display: inline-block;
  flex-direction: column;
}
.title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}
.content {
  display: flex;
  flex-direction: column;
}
.content_title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}
.content_table {
  display: flex;
  flex-direction: column;
}
.table_head {
  display: flex;
  flex-direction: row;
  padding-bottom: 5px;
  border-bottom: 1px solid #333;
  align-items: flex-start;
}
.table_head > div {
  font-weight: 600;
  font-size: 12px;
}

.teble_content {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
.teble_content_row {
  display: flex;
  flex-direction: row;
  font-size: 10px;
  height: 30px;
  align-items: center;
  border-bottom: 1px solid #888;
}

.table_head,
.teble_content,
.teble_content_row {
  width: 300px;
}
.table_head > div,
.teble_content_row > div {
  flex: 0.8;
}
.table_head > div:first-child,
.teble_content_row > div:first-child {
  flex: 0.6;
}

.table_head > div:last-child,
.teble_content_row > div:last-child {
  flex: 1.6;
}
</style>
